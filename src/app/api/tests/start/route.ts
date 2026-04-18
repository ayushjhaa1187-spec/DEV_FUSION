import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Exponential backoff helper
async function generateWithRetry(genAI: GoogleGenerativeAI, prompt: string, schema: any, maxRetries = 3) {
  let retries = 0;
  let delay = 1000;

  while (retries < maxRetries) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error: any) {
      if (error.status === 429 || error.message?.includes('429')) {
        retries++;
        console.warn(`[Gemini API] Rate limit hit. Retrying in ${delay}ms... (Attempt ${retries}/${maxRetries})`);
        if (retries >= maxRetries) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        throw error;
      }
    }
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, topic, questionCount = 5 } : { subject: string, topic: string, questionCount?: number } = await req.json();

    if (!subject || !topic) {
      return NextResponse.json({ error: 'Subject and Topic are required' }, { status: 400 });
    }

    // 1. Check if test already exists in Global Bank
    const { data: existingTest, error: testFetchError } = await supabase
      .from('global_tests')
      .select('id, total_questions')
      .eq('subject', subject)
      .eq('topic', topic)
      .maybeSingle();

    if (testFetchError && testFetchError.code !== 'PGRST116') {
      console.error('[POST /api/tests/start] Error checking global bank:', testFetchError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    let testId = existingTest?.id;
    let finalQuestionCount = existingTest?.total_questions || questionCount;

    // 2. Generate via Gemini if not exists
    if (!testId) {
      console.log(`[POST /api/tests/start] Test not in bank: ${subject} - ${topic}. Contacting Gemini...`);
      
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
      
      const schema: any = {
        type: SchemaType.ARRAY,
        description: "A list of multiple choice questions.",
        items: {
          type: SchemaType.OBJECT,
          properties: {
            question: {
              type: SchemaType.STRING,
              description: "The text of the question."
            },
            options: {
              type: SchemaType.ARRAY,
              description: "Exactly 4 string options for the multiple choice. Only one is correct.",
              items: { type: SchemaType.STRING }
            },
            correct_index: {
              type: SchemaType.INTEGER,
              description: "The integer index (0, 1, 2, or 3) indicating which option in the 'options' array is the correct answer."
            }
          },
          required: ["question", "options", "correct_index"]
        }
      };

      const prompt = `You are a JSON-only test generator. Create a ${questionCount} question multiple-choice test on ${topic} within ${subject}. Return strictly a JSON array of objects.`;

      const aiQuestions = await generateWithRetry(genAI, prompt, schema);

      if (!Array.isArray(aiQuestions) || aiQuestions.length === 0) {
        throw new Error("AI returned invalid question format.");
      }

      // Start a transaction-like sequence (Supabase JS doesn't have true transactions without RPC, 
      // but we do sequential inserts).
      
      // 2a. Insert generic test metadata
      const { data: newTest, error: insertTestError } = await supabase
        .from('global_tests')
        .insert({ subject, topic, total_questions: aiQuestions.length })
        .select('id')
        .single();
        
      if (insertTestError) {
        console.error('[POST /api/tests/start] Error creating global test:', insertTestError);
        return NextResponse.json({ error: 'Database insertion error' }, { status: 500 });
      }
      
      testId = newTest.id;
      finalQuestionCount = aiQuestions.length;

      // 2b. Insert questions
      const formattedQuestions = aiQuestions.map((q: any, i: number) => ({
        test_id: testId,
        question_text: q.question,
        options: q.options,
        correct_index: q.correct_index,
        order_index: i
      }));

      const { error: insertQuestionsError } = await supabase
        .from('global_test_questions')
        .insert(formattedQuestions);

      if (insertQuestionsError) {
        console.error('[POST /api/tests/start] Error creating test questions:', insertQuestionsError);
        return NextResponse.json({ error: 'Database insertion error' }, { status: 500 });
      }
    }

    // 3. Create a Test Attempt for the specific user
    const { data: attempt, error: attemptError } = await supabase
      .from('test_attempts')
      .insert({
        user_id: user.id,
        test_id: testId,
        total_questions: finalQuestionCount,
        status: 'IN_PROGRESS'
      })
      .select('id, started_at')
      .single();

    if (attemptError || !attempt) {
      console.error('[POST /api/tests/start] Error creating attempt:', attemptError);
      return NextResponse.json({ error: 'Could not create test attempt' }, { status: 500 });
    }

    // 4. Fetch the questions (without correct_index) to send to the client
    const { data: questionsData, error: fetchQError } = await supabase
      .from('global_test_questions')
      .select('id, question_text, options, order_index')
      .eq('test_id', testId)
      .order('order_index', { ascending: true });

    if (fetchQError) {
        console.error('[POST /api/tests/start] Error fetching questions for client:', fetchQError);
        return NextResponse.json({ error: 'Could not load questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attempt_id: attempt.id,
      started_at: attempt.started_at,
      total_questions: finalQuestionCount,
      questions: questionsData // Safe payload: NO correct_index
    });

  } catch (error: any) {
    console.error('[POST /api/tests/start] Server Error:', error.message || error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
