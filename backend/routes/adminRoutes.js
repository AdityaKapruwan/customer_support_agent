import express from 'express';
import { getAdminStats, getRecentTickets, updateTicketStatus } from '../controllers/adminController.js';

const router = express.Router();

router.get('/admin/stats', getAdminStats);
router.get('/admin/tickets', getRecentTickets);
router.patch('/admin/tickets/:ticketId/status', updateTicketStatus);

export default router;
