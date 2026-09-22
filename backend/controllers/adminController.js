import Conversation from '../models/Conversation.js';
import Ticket from '../models/Ticket.js';
import Feedback from '../models/Feedback.js';

/**
 * Handles GET /api/admin/stats
 * Aggregates dashboard analytics: conversations, tickets, resolved, escalated, avg confidence, distributions.
 */
export const getAdminStats = async (req, res) => {
  try {
    const totalConversations = await Conversation.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
    const escalatedTickets = await Ticket.countDocuments({ status: 'escalated' });

    // Calculate average confidence score across all tickets
    const avgConfidenceAgg = await Ticket.aggregate([
      { $group: { _id: null, avgConf: { $avg: '$confidence' } } }
    ]);
    const avgConfidence = avgConfidenceAgg.length > 0 && avgConfidenceAgg[0].avgConf !== null
      ? Math.round(avgConfidenceAgg[0].avgConf * 100) / 100
      : 0;

    // Intent distribution aggregation
    const intentAgg = await Ticket.aggregate([
      { $group: { _id: '$predictedIntent', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const intentDistribution = {};
    intentAgg.forEach(item => {
      if (item._id) intentDistribution[item._id] = item.count;
    });

    // Agent distribution aggregation
    const agentAgg = await Ticket.aggregate([
      { $group: { _id: '$assignedAgent', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    const agentDistribution = {};
    agentAgg.forEach(item => {
      const key = item._id || 'Unassigned';
      agentDistribution[key] = item.count;
    });

    // Feedback statistics
    const totalFeedback = await Feedback.countDocuments();
    const helpfulFeedback = await Feedback.countDocuments({ rating: { $gte: 4 } });

    return res.status(200).json({
      success: true,
      stats: {
        totalConversations,
        totalTickets,
        resolvedTickets,
        escalatedTickets,
        averageConfidence: avgConfidence,
        intentDistribution,
        agentDistribution,
        feedbackStats: {
          total: totalFeedback,
          helpful: helpfulFeedback,
          notHelpful: totalFeedback - helpfulFeedback
        }
      }
    });

  } catch (error) {
    console.error('[Admin Controller Stats Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to load admin dashboard stats.' });
  }
};

/**
 * Handles GET /api/admin/tickets
 * Fetches recent ticket logs.
 */
export const getRecentTickets = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '50', 10);
    const tickets = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(limit);

    return res.status(200).json({
      success: true,
      tickets: tickets.map(t => ({
        ticketId: t._id,
        conversationId: t.conversationId,
        query: t.query,
        predictedIntent: t.predictedIntent,
        confidence: t.confidence,
        assignedAgent: t.assignedAgent || 'Unassigned',
        status: t.status,
        createdAt: t.createdAt
      }))
    });
  } catch (error) {
    console.error('[Admin Controller Tickets Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to fetch tickets.' });
  }
};

/**
 * Handles PATCH /api/admin/tickets/:ticketId/status
 * Updates ticket status (e.g. resolve ticket).
 */
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!['open', 'in_progress', 'resolved', 'escalated', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Validation Error: Invalid ticket status value.' });
    }

    const ticket = await Ticket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found.' });
    }

    return res.status(200).json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('[Admin Controller Update Status Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to update ticket status.' });
  }
};

export default {
  getAdminStats,
  getRecentTickets,
  updateTicketStatus
};
