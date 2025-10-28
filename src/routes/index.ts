import * as express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import googleAuthRoutes from './googleAuthRoutes';

const Routes = express.Router();

Routes.use("/user", userRoutes);
Routes.use("/auth", authRoutes);
Routes.use("/auth", googleAuthRoutes);

export default Routes;