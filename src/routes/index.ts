import * as express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';

const Routes = express.Router();

Routes.use("/user", userRoutes);
Routes.use("/auth", authRoutes);

export default Routes;