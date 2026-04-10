import '../landing.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blog | DEV_FUSION',
  description: 'Insights, student success stories, and platform updates from the SkillBridge community.',
  openGraph: {
    title: 'Blog | DEV_FUSION',
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
      
      <section className="sb-hero" style={{ paddingTop: '160px' }}>
        <div className="sb-heroBadge">
          <span className="sb-badgeDot" />
          SkillBridge Blog
        </div>

        <h1 className="sb-title">
          Stories of <span>Growth.</span>
        </h1>

        <p className="sb-subtitle">
          Insights, student success stories, and platform updates from the SkillBridge community.
        </p>
      </section>

      <section className="sb-section">
        <div className="sb-blogs" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          {stories.map((story, i) => (
            <article key={i} className="sb-blog" style={{ opacity: 1, transform: 'none' }}>
              <div className={`sb-blogThumb ${story.color}`}>{story.icon}</div>
              <div className="sb-blogBody">
                <span>{story.tag}</span>
                <h3>{story.title}</h3>
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
