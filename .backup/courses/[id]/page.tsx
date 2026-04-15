import { COURSE_DATA } from '@/lib/constants';
import CourseDetailClient from './CourseDetailClient';
import { Metadata } from 'next';

type Props = {
  params: Promise<{ id: string }>
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const course = COURSE_DATA[id];
  
  if (!course) {
    return {
      title: 'Course Not Found | DEV_FUSION',
    };
  }

  return {
    title: `${course.title} | DEV_FUSION`,
    description: course.description,
    openGraph: {
      title: course.title,
      description: course.description,
      images: [course.image],
      type: 'website',
    },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { id } = await params;
  const course = COURSE_DATA[id];

  return <CourseDetailClient course={course} />;
}
