import React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import SignIn from './pages/SignIn.jsx'
import SignUp from './pages/SignUp.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ProfileCreate from './pages/ProfileCreate.jsx'
import ProfileView from './pages/ProfileView.jsx'
import WorkspaceLayout from './components/Layout/WorkspaceLayout.jsx'
import WorkspaceHome from './pages/workspace/Home.jsx'
import Messages from './pages/workspace/Messages.jsx'
import Teams from './pages/workspace/Teams.jsx'
import History from './pages/workspace/History.jsx'
import Players from './pages/workspace/Players.jsx'
import Tournaments from './pages/workspace/Tournaments.jsx'
import TournamentCreate from './pages/workspace/TournamentCreate.jsx'

const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: '/signin', element: <SignIn /> },
  { path: '/signup', element: <SignUp /> },
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/profile/create', element: <ProfileCreate /> },
  { path: '/profile', element: <ProfileView /> },
  {
    path: '/workspace',
    element: <WorkspaceLayout />,
    children: [
      { index: true, element: <WorkspaceHome /> },
      { path: 'players', element: <Players /> },
      { path: 'tournaments', element: <Tournaments /> },
      { path: 'tournaments/create', element: <TournamentCreate /> },
      { path: 'messages', element: <Messages /> },
      { path: 'teams', element: <Teams /> },
      { path: 'history', element: <History /> },
    ],
  },
])

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
) 
