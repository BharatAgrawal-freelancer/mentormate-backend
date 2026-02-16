// controllers/agoraController.js
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");
const Request = require("../models/request");

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

function generateAgoraToken(channelName, uid) {
  const role = RtcRole.PUBLISHER;
  const expireTime = 3600; // 1 hour
  const currentTime = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTime + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return { token, privilegeExpireTime };
}

// Create Mentor Token
exports.createMentorToken = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const channelName = `session_${request._id}`;
    const uid = Math.floor(Math.random() * 100000);

    const { token, privilegeExpireTime } = generateAgoraToken(channelName, uid);

    request.agoraTokenMentor = token;
    request.channelName = channelName;
    request.tokenExpireTime = privilegeExpireTime;
    await request.save();

    res.json({
      message: "Mentor token created",
      token,
      channelName,
      uid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// Create Mentee Token
exports.createMenteeToken = async (req, res) => {
  try {
    const { requestId } = req.params;
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    const channelName = `session_${request._id}`;
    const uid = Math.floor(Math.random() * 100000);

    const { token, privilegeExpireTime } = generateAgoraToken(channelName, uid);

    request.agoraTokenMentee = token;
    request.channelName = channelName;
    request.tokenExpireTime = privilegeExpireTime;
    await request.save();

    res.json({
      message: "Mentee token created",
      token,
      channelName,
      uid
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
