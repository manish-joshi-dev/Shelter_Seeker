import AdminActivity from '../model/adminActivity.model.js';
import User from '../model/user.model.js';

const getRequestIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim();
    }
    console.log("get ip");
    console.log(req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || "ipoop");
    return req.ip || req.socket?.remoteAddress || req.connection?.remoteAddress || null;
};

export const logAdminAudit = async ({
    req,
    action,
    targetType,
    targetId = null,
    targetName = '',
    metadata = undefined,
}) => {
    console.log("admin audit called");
    if (!req?.user?.id || !action || !targetType) {
        return;
    }

    try {
        let adminName = req.user.username || '';

        if (!adminName) {
            const adminUser = await User.findById(req.user.id).select('username').lean();
            adminName = adminUser?.username || '';
        }

        await AdminActivity.create({
            adminId: String(req.user.id),
            adminName,
            action,
            targetId: targetId ? String(targetId) : null,
            targetType,
            targetName,
            ip: getRequestIp(req),
            userAgent: req.get('User-Agent') || '',
            metadata,
            timestamp: new Date(),
        });
    } catch (error) {
        console.error('Error logging admin audit trail:', error);
    }
};

export default logAdminAudit;
