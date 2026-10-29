import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { ProblemSolverPage } from './pages/ProblemSolverPage';
import { StudyPlansPage } from './pages/StudyPlansPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ResearchPage } from './pages/ResearchPage';
import { AssessmentsPage } from './pages/AssessmentsPage';
import { InterviewPage } from './pages/InterviewPage';
import { MLDesignPage } from './pages/MLDesignPage';
import { ProfilePage } from './pages/ProfilePage';
import { ArrayBlitzPage } from './pages/ArrayBlitzPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen h-[100dvh] bg-background text-foreground flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 min-h-0 overflow-hidden relative">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/problems" element={<ProblemsPage />} />
            <Route path="/blitz" element={<ArrayBlitzPage />} />
            <Route path="/speedrun" element={<Navigate to="/blitz" replace />} />
            <Route path="/problems/:slug" element={<ProblemSolverPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<ProfilePage />} />
            <Route path="/interview" element={<InterviewPage />} />
            <Route path="/mock-interview" element={<Navigate to="/interview" replace />} />
            <Route path="/flashcards" element={<Navigate to="/interview" replace />} />
            <Route path="/interview/solve/:slug" element={<ProblemSolverPage />} />
            <Route path="/interview/:slug" element={<ProblemSolverPage />} />
            <Route path="/assessments" element={<Navigate to="/interview" replace />} />
            <Route path="/study-plans" element={<StudyPlansPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/research/:paperId" element={<ResearchPage />} />
            <Route path="/research/:paperId/:slug" element={<ProblemSolverPage />} />
            <Route path="/ml-design" element={<MLDesignPage />} />
            <Route path="/systems" element={<MLDesignPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
};
