import { useCallback, useEffect, useMemo, useState } from 'react';
import { COURSES, localizedCourse } from '@barruu/content';
import { courseLessons, loadProfile, saveProfile, type LearnerProfile } from '@barruu/engine';
import { useI18n } from './i18n';
import { useRoute, paths } from './router';
import { DraftNotice, Footer, Header, Page } from './components/Layout';
import { Link } from './components/Link';
import { Home } from './pages/Home';
import { Catalog } from './pages/Catalog';
import { CourseDetail } from './pages/CourseDetail';
import { Placement } from './pages/Placement';
import { Progress } from './pages/Progress';
import { LessonPlayer } from './player/LessonPlayer';

export default function App() {
  const route = useRoute();
  const { t, locale } = useI18n();
  const [profile, setProfile] = useState<LearnerProfile>(() => loadProfile());
  const updateProfile = useCallback((p: LearnerProfile) => { setProfile(p); saveProfile(p); }, []);
  const courses = useMemo(() => COURSES.map((c) => localizedCourse(c, locale)), [locale]);
  const find = (id: string) => courses.find((c) => c.id === id);

  useEffect(() => { document.title = `${t('app.name')} — ${t('app.tagline')}`; }, [t]);

  if (route.page === 'lesson') {
    const course = find(route.courseId);
    const lessons = course ? courseLessons(course) : [];
    const i = lessons.findIndex((l) => l.id === route.lessonId);
    if (course && i >= 0) {
      return <><DraftNotice /><LessonPlayer key={`${locale}:${lessons[i].id}`} course={course} lesson={lessons[i]} nextLesson={lessons[i + 1]} profile={profile} onProfileChange={updateProfile} /></>;
    }
  }

  let body: React.ReactNode;
  switch (route.page) {
    case 'home': body = <Home courses={courses} />; break;
    case 'courses': body = <Catalog courses={courses} subject={route.subject} grade={route.grade} />; break;
    case 'course': { const c = find(route.courseId); body = c ? <CourseDetail key={c.id} course={c} /> : <NotFound />; break; }
    case 'placement': body = <Placement courses={courses} />; break;
    case 'progress': body = <Progress courses={courses} />; break;
    default: body = <NotFound />;
  }
  return <div className="min-h-dvh"><DraftNotice /><Header route={route} />{body}<Footer /></div>;
}

function NotFound() {
  const { t } = useI18n();
  return <Page className="py-24 text-center"><Link to={paths.courses()} className="rounded-xl bg-stone-900 px-6 py-3 font-bold text-white">{t('nav.courses')}</Link></Page>;
}
