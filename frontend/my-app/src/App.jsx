import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import PrivateRoute from './components/auth/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import InterviewLobby from './pages/InterviewLobby';
import InterviewRoom from './pages/InterviewRoom';
import Login from './pages/Login';
import Practice from './pages/Practice';
import Register from './pages/Register';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <main className="page-shell">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route element={<PrivateRoute />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/practice" element={<Practice />} />
                <Route path="/interview" element={<InterviewLobby />} />
                <Route path="/interview/:roomId" element={<InterviewRoom />} />
              </Route>

              <Route path="*" element={<Navigate replace to="/" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
