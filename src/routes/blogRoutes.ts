import express from 'express';
import {
  createBlog,
  listBlogs,
  getBlogDetails,
  updateBlog
} from '../controllers/blogController';

const router = express.Router();

router.post('/', createBlog);
router.get('/', listBlogs);
router.get('/:id', getBlogDetails);
router.put('/:id', updateBlog);

export default router;