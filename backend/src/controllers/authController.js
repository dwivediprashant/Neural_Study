import User from '../models/User.js';
import { signJwt, setAuthCookie, clearAuthCookie } from '../utils/token.js';

const sanitizeUser = (user) => {
  if (!user) return null;
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
  };
};

export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'student' } = req.body ?? {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, role });
    const token = signJwt({ id: user._id, role: user.role });
    setAuthCookie(res, token);

    res.status(201).json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Failed to create account' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signJwt({ id: user._id, role: user.role });
    setAuthCookie(res, token);

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to sign in' });
  }
};

export const logout = async (_req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
};

export const me = async (req, res) => {
  const user = await User.findById(req.user?.id);
  if (!user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({ user: sanitizeUser(user) });
};
