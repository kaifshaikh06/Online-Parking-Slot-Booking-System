import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ManageSlots from './pages/ManageSlots';
import AddSlot from './pages/AddSlot';
import EditSlot from './pages/EditSlot';
import SearchBookings from './pages/SearchBookings';
import UserDashboard from './pages/UserDashboard';
import BookSlot from './pages/BookSlot';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';

const NotFound = () => <main className="container page"><h1>Page not found</h1></main>;

const App = () => <><Navbar /><Routes>
  <Route path="/" element={<Home />} />
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route element={<ProtectedRoute />}>
    <Route element={<UserRoute />}>
    <Route path="/dashboard" element={<UserDashboard />} />
    <Route path="/book-slot" element={<BookSlot />} />
    <Route path="/my-bookings" element={<MyBookings />} />
    <Route path="/profile" element={<Profile />} />
    </Route>
  </Route>
  <Route element={<AdminRoute />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/slots" element={<ManageSlots />} />
    <Route path="/admin/slots/new" element={<AddSlot />} />
    <Route path="/admin/slots/:id/edit" element={<EditSlot />} />
    <Route path="/admin/bookings" element={<SearchBookings />} />
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes></>;

export default App;
