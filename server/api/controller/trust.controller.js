import TrustSystemService from '../services/trustSystem.service.js';
import logAdminAudit from '../services/adminAudit.service.js';
import User from '../model/user.model.js';
import { errorHandler } from '../utils/error.js';

/**
 * Update user trust points (Admin only)
 * PUT /api/trust/:id/points
 */
export const updateTrustPoints = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { points, action, reason } = req.body;
        const adminId = req.user.id;

        // Validate input
        if (!points || typeof points !== 'number') {
            return next(errorHandler(400, 'Points value is required and must be a number'));
        }

        if (!action) {
            return next(errorHandler(400, 'Action is required'));
        }

        // Check if user exists
        const user = await User.findById(id);
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        // Update trust points
        const result = await TrustSystemService.updateTrustPoints(
            id,
            action,
            adminId,
            reason
        );

        if (!result.success) {
            return next(errorHandler(500, result.error));
        }

        await logAdminAudit({
            req,
            action: 'UPDATE_TRUST_POINTS',
            targetType: 'user',
            targetId: id,
            targetName: user.username,
            metadata: {
                trustAction: action,
                pointsRequested: points,
                oldPoints: user.trustPoints,
                newPoints: result.user.trustPoints,
                reason: reason || null,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Trust points updated successfully',
            data: result.user
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get seller profile with trust information
 * GET /api/trust/seller/:id
 */
export const getSellerProfile = async (req, res, next) => {
    try {
        const { id } = req.params;

        const result = await TrustSystemService.getSellerProfile(id);

        if (!result.success) {
            return next(errorHandler(500, result.error));
        }

        res.status(200).json({
            success: true,
            data: result.seller
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get top trusted sellers
 * GET /api/trust/top-sellers
 */
export const getTopSellers = async (req, res, next) => {
    try {
        const { limit = 10 } = req.query;

        const result = await TrustSystemService.getTopSellers(parseInt(limit));

        if (!result.success) {
            return next(errorHandler(500, result.error));
        }

        res.status(200).json({
            success: true,
            data: result.sellers
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get trust statistics for admin dashboard
 * GET /api/trust/statistics
 */
export const getTrustStatistics = async (req, res, next) => {
    try {
        const result = await TrustSystemService.getTrustStatistics();

        if (!result.success) {
            return next(errorHandler(500, result.error));
        }

        res.status(200).json({
            success: true,
            data: result.statistics
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Auto-update seller rating and verification status
 * PATCH /api/trust/seller/:id/auto-update
 */
export const autoUpdateSeller = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        // Recalculate rating and verification status
        const oldRating = user.rating;
        const oldVerifiedSeller = user.verifiedSeller;
        user.rating = Math.min(5, Math.max(0, parseFloat((user.trustPoints / 20).toFixed(1))));
        user.verifiedSeller = user.trustPoints >= 60;
        
        await user.save();

        await logAdminAudit({
            req,
            action: 'AUTO_UPDATE_SELLER_STATUS',
            targetType: 'user',
            targetId: id,
            targetName: user.username,
            metadata: {
                trustPoints: user.trustPoints,
                oldRating,
                newRating: user.rating,
                oldVerifiedSeller,
                newVerifiedSeller: user.verifiedSeller,
            },
        });

        res.status(200).json({
            success: true,
            message: 'Seller status updated successfully',
            data: {
                id: user._id,
                username: user.username,
                trustPoints: user.trustPoints,
                rating: user.rating,
                verifiedSeller: user.verifiedSeller,
                sellerLevel: user.getSellerLevel()
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get user's trust history
 * GET /api/trust/:id/history
 */
export const getTrustHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const user = await User.findById(id).select('trustHistory username');
        if (!user) {
            return next(errorHandler(404, 'User not found'));
        }

        // Paginate trust history
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedHistory = user.trustHistory
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(startIndex, endIndex);

        res.status(200).json({
            success: true,
            data: {
                username: user.username,
                history: paginatedHistory,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(user.trustHistory.length / limit),
                    totalEntries: user.trustHistory.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Batch update trust points for multiple users
 * POST /api/trust/batch-update
 */
export const batchUpdateTrustPoints = async (req, res, next) => {
    try {
        const { updates } = req.body;
        const adminId = req.user.id;

        if (!Array.isArray(updates) || updates.length === 0) {
            return next(errorHandler(400, 'Updates array is required'));
        }

        // Add admin ID to each update
        const updatesWithAdmin = updates.map(update => ({
            ...update,
            adminId
        }));

        const result = await TrustSystemService.batchUpdateTrustPoints(updatesWithAdmin);

        if (!result.success) {
            return next(errorHandler(500, result.error));
        }

        await logAdminAudit({
            req,
            action: 'BATCH_UPDATE_TRUST_POINTS',
            targetType: 'user',
            targetName: `${updates.length} users`,
            metadata: {
                totalUpdatesRequested: updates.length,
                successfulUpdates: result.results.filter((entry) => entry.success).length,
                failedUpdates: result.results.filter((entry) => !entry.success).length,
                updates: updates.map((update) => ({
                    userId: update.userId,
                    actionType: update.actionType,
                    customReason: update.customReason || null,
                })),
            },
        });

        res.status(200).json({
            success: true,
            message: 'Batch update completed',
            data: result.results
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get seller level distribution
 * GET /api/trust/levels
 */
export const getSellerLevels = async (req, res, next) => {
    try {
        const levels = await User.aggregate([
            { $match: { role: 'seller', isBanned: false } },
            {
                $group: {
                    _id: {
                        $switch: {
                            branches: [
                                { case: { $gte: ['$trustPoints', 100] }, then: 'Platinum' },
                                { case: { $gte: ['$trustPoints', 61] }, then: 'Gold' },
                                { case: { $gte: ['$trustPoints', 31] }, then: 'Silver' },
                                { case: { $gte: ['$trustPoints', 0] }, then: 'Bronze' }
                            ],
                            default: 'Bronze'
                        }
                    },
                    count: { $sum: 1 },
                    avgPoints: { $avg: '$trustPoints' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: levels
        });
    } catch (error) {
        next(error);
    }
};
