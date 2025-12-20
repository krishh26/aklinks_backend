import * as express from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import googleAuthRoutes from './googleAuthRoutes';
import linkRoutes from './linkRoutes';
import trafficSourceRoutes from './trafficSourceRoutes';
import supportRoutes from './supportRoutes';

const Routes = express.Router();

Routes.use("/user", userRoutes);
Routes.use("/auth", authRoutes);
Routes.use("/auth", googleAuthRoutes);
Routes.use("/link", linkRoutes);
Routes.use('/traffic-source', trafficSourceRoutes);
Routes.use('/support', supportRoutes);

export default Routes;