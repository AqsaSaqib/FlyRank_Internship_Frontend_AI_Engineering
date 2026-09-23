import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { BookshelfProvider, useBookshelf } from './context/BookshelfContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './pages/Home/HomeView';
import { BookDetailsView } from './pages/BookDetails/BookDetailsView';
import { BookshelfView } from './pages/Bookshelf/BookshelfView';
import { NotFoundView } from './pages/NotFound/NotFoundView';

const NavigationHeader: React.FC = () => {
  const { totalCount } = useBookshelf();
  return <Header shelfCount={totalCount} />;
};

export const App: React.FC = () => {
  return (
    <BookshelfProvider>
      <BrowserRouter>
        <NavigationHeader />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/book/:id" element={<BookDetailsView />} />
            <Route path="/bookshelf" element={<BookshelfView />} />
            <Route path="*" element={<NotFoundView />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </BookshelfProvider>
  );
};
