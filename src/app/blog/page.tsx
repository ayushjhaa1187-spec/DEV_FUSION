import '../landing.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | SkillBridge',
  description: 'Insights, student success stories, and platform updates from the SkillBridge community.',
  openGraph: {
    title: 'Blog | SkillBridge',
    description: 'Insights, student success stories, and platform updates from the SkillBridge community.',
    type: 'website'
  }
};

export default function BlogPage() {
  const stories = [
    {
      title: "From 0 to Scholar: How Riya mastered DS & Algo",
      tag: "Success Story",
      desc: "Riya used the AI practice engine daily to overcome her fear of data structures and eventually became a top mentor.",
      color: "purple",
      icon: "AI"
    },
    {
      title: "The power of 500 reputation points",
      tag: "Community",
      desc: "How building a reputation on SkillBridge helped Arjun land a technical internship through community networking.",
      color: "green",
      icon: "REP"
    },
    {
      title: "Why peer teaching is the best way to learn",
      tag: "Pedagogy",
      desc: "Exploring the science behind why explaining concepts to others solidifies your own understanding.",
      color: "gold",
      icon: "MNT"
    }
  ];

  return (
    <main className="sb-page">
      
      <section className="hero" style={{ paddingTop: '160px' }}>
        <div className="hero-badge">
          <span className="dot" />
          SkillBridge Blog
        </div>

        <h1 className="title">
          Stories of <span>Growth.</span>
        </h1>

        <p className="tagline">
          Insights, student success stories, and platform updates from the SkillBridge community.
        </p>
      </section>

      <section className="section">
        <div className="blogs-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          {stories.map((story, i) => (
            <article key={i} className="blog-card" style={{ opacity: 1, transform: 'none' }}>
              <div className={`blog-thumb ${story.color}`}>{story.icon}</div>
              <div className="blog-body">
                <span className="blog-tag">{story.tag}</span>
                <h3 className="blog-title">{story.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                  {story.desc}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
