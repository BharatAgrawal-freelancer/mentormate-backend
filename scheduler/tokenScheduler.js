const cron = require("node-cron");
const Request = require("../models/request");
const { RtcTokenBuilder, RtcRole } = require("agora-access-token");

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

function scheduleAgoraTokenGeneration() {
  // Run every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      // Find requests scheduled in next 10 minutes which don't have tokens yet
      const requests = await Request.find({
        "schedule.year": now.getFullYear(),
        "schedule.month": now.getMonth() + 1,
        "schedule.date": now.getDate(),
        agoraTokenMentor: { $exists: false },
        agoraTokenMentee: { $exists: false },
      });

      for (const req of requests) {
        const [hour, minute] = req.schedule.time.split(":").map(Number);
        const scheduledTime = new Date(
          req.schedule.year,
          req.schedule.month - 1,
          req.schedule.date,
          hour,
          minute
        );

        const diff = (scheduledTime - now) / 1000; // in seconds

        if (diff <= 600 && diff > 0) {
          const channelName = `session_${req._id}`;
          const expireTime = 3600; // 1 hour
          const currentTime = Math.floor(Date.now() / 1000);
          const privilegeExpireTime = currentTime + expireTime;

          // Generate tokens for mentor & mentee with different UIDs
          const mentorUid = Math.floor(Math.random() * 100000);
          const menteeUid = Math.floor(Math.random() * 100000);

          const mentorToken = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            mentorUid,
            RtcRole.PUBLISHER,
            privilegeExpireTime
          );

          const menteeToken = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            channelName,
            menteeUid,
            RtcRole.PUBLISHER,
            privilegeExpireTime
          );

          // Save in DB
          req.agoraTokenMentor = mentorToken;
          req.agoraTokenMentee = menteeToken;
          req.channelName = channelName;
          req.tokenExpireTime = privilegeExpireTime;

          await req.save();

          console.log(`Mentor & Mentee tokens generated for request ${req._id}`);
        }
      }
    } catch (err) {
      console.error("Scheduler Error:", err);
    }
  });
}

module.exports = scheduleAgoraTokenGeneration;
