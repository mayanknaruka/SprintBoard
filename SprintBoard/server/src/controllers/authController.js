import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

export async function register(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // First registered user becomes admin; otherwise respect requested role or default member
    const userCount = await User.countDocuments();
    const assignedRole = userCount === 0 ? 'admin' : role === 'admin' ? 'admin' : 'member';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
    });

    const token = signToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user: user.toSafeJSON(), token },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = signToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: user.toSafeJSON(), token },
    });
  } catch (error) {
    next(error);
  }
}

export async function getProfile(req, res) {
  res.json({
    success: true,
    data: { user: req.user.toSafeJSON() },
  });
}
