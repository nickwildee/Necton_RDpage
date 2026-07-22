import { createBrowserRouter } from 'react-router-dom'
import { HomePage } from '@pages/home'
import { ClassifierPage } from '@pages/classifier'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/classifier',
    element: <ClassifierPage />,
  },
])
