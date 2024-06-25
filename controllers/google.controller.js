const { google } = require('googleapis');
const nodemailer = require("nodemailer");

const googleController = {
    init: (req, res, next) => {
        try {
            req.oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT, process.env.GOOGLE_SECRET)
            if (!req.user.auth.google.refresh_token) return googleController.oauth.redirect(req, res)
            req.oauth2Client.setCredentials({ refresh_token: req.user.auth.google.refresh_token });
            googleController.calendar = google.calendar({ version: 'v3', auth: req.oauth2Client })
            googleController.drive = google.drive({ version: 'v3', auth: req.oauth2Client })
            googleController.sheets = google.sheets({ version: 'v4', auth: req.oauth2Client })
            googleController.drive = google.drive({ version: 'v3', auth: req.oauth2Client })
            googleController.gmail = google.gmail({ version: 'v1', auth: req.oauth2Client })
            googleController.search = google.customsearch('v1')
            next()
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },
    oauth: {
        redirect: async (req, res) => {
            try {
                req.oauth2Client.redirectUri = `http://localhost:3000/google/oauth/token`;
                if (!req.query.scopes)
                    req.query.scopes = "https://mail.google.com,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/userinfo.email,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/calendar";
                const url = req.api.google.oauth2Client.generateAuthUrl({
                    access_type: "offline",
                    scope: req.query.scopes.split(","),
                });
                res.redirect(url);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        },
        getToken: async (req, res) => {
            try {
                return await req.oauth2Client.getToken(req.query.code)
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    },
    gmail: {
        async send(req, res) {
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: {
                        type: "OAuth2",
                        user: req.user.email,
                        clientId: process.env.GOOGLE_CLIENT,
                        clientSecret: process.env.GOOGLE_SECRET,
                        refreshToken: req.user.auth.google.refresh_token,
                        // accessToken: accessToken.token,
                    },
                });
                req.body.html = `<div>${req.body.html || "Contenu de l'e-mail en html"}</div>`
                const signature = `<table cellspacing="0" style="font-family: Arial; background: transparent; font-size: 13px; color: rgb(0, 0, 0); line-height: 1.2; display: inline-table;" data-width-toget="457" data-height-toget="390" data-logo-width="80" data-logo-height="80"><tbody><tr style="color: inherit;"> <td style="color: inherit; background-color: rgb(255, 255, 255); text-align: left; white-space: normal; border-width: initial; border-style: initial; border-color: rgb(255, 255, 255);" rowspan="1" colspan="1" data-reply="3" ddirection="3"><table style="width: 100%; border-collapse: separate; font-family: Arial; background: transparent; font-size: 13px; color: rgb(0, 0, 0); line-height: 1.2;" cellspacing="0"><tbody><tr style="height: auto; color: inherit;"><td style="color: inherit; text-align: left; padding-top: 0px; padding-bottom: 0px; white-space: normal; border-width: initial; border-style: initial; border-color: rgb(255, 255, 255);" rowspan="1" colspan="1" data-reply="3" ddirection="3"> <table style="width: 100%; height: 100%; border-collapse: separate; font-family: Arial; background: transparent; font-size: 13px; color: rgb(0, 0, 0); line-height: 1.2;" cellspacing="0"><tbody><tr style="color: inherit;"> <td style="color: inherit; text-align: left; height: 93px; width: 100px; white-space: normal; border-width: initial; border-style: initial; border-color: rgb(255, 255, 255);" rowspan="1" colspan="1" height="93px" width="100px" data-reply="3" ddirection="3"><img width="80" data-forme="50" data-link="" height="80" style="width:80px;height:80px;-webkit-border-radius:50%;-moz-border-radius:50%; border-radius: 50%;" src="https://img.signitic.app/uploads/c-5b4fa05f31e526c4918e4b0b76fccaae.png" data-absolute="https://img.signitic.app/uploads/" alt="Tom ZAPICO"></td><td style="color: inherit; width: 329px; height: 93px; text-align: left; padding: 0px 0px 0px 20px; background-color: rgb(255, 255, 255); white-space: normal; border-left: 2px solid rgb(255, 180, 18); border-top: 0px none rgb(255, 255, 255); border-bottom: 0px none rgb(255, 255, 255);" rowspan="1" colspan="1" width="329px" height="93px" data-reply="3" ddirection="3"> <div style="white-space: normal;"><p style="white-space: normal; margin: 0px;"><span style="color: #ffb412;"><strong><span style="font-size: 15px;">Tom ZAPICO<br></span></strong></span><span style="color: #000000;"><strong>Directeur, Alter Recrut<br></strong></span><br><span style="color: #95a5a6;">t.zapico@alter-recrut.fr</span><br><span style="color: #95a5a6;">0665774180</span></p></div> </td> </tr> </tbody></table> </td></tr><tr style="color: inherit;"><td style="color: inherit; text-align: left; padding-top: 15px; padding-bottom: 15px; white-space: normal; border-width: initial; border-style: initial; border-color: rgb(255, 255, 255);" rowspan="1" data-reply="3" ddirection="3" colspan="1"> <div style="height: initial; line-height: 0px; display: inline-block; white-space: normal;"><table align="left" cellspacing="0" cellpadding="0" style="text-align:inherit;margin:0;"><tbody><tr style="text-align: inherit; color: inherit;"><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-bDh2a2xCS2VaVHRuaUQzenVMaFphUT09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_facebook.png" alt="facebook" data-link=""></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-cDlZVm4yZHBQMTIzVXVxNk9tS05GQT09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_tiktok.png" alt="tiktok"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-VjFWNTBIYlNCUDdIbXlxKzJyRzFPUT09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_twitter.png" alt="twitter"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-VzNGNG5oU1pWYjZRMTVQMUxBZ2xJZz09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_web.png" alt="web"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-SFZZeTM2NTlmRzJoUVpSUWhzVzA1Zz09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_calendrier.png" alt="calendrier"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-MVc4eTk5YXpOcDFSNDR3dDdleFhiQT09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_instagram.png" alt="instagram"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-eFZMaExNZWZGQjMvaVVJaDArTTl6Zz09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_linkedin.png" alt="linkedin"></a></td><td style="width: 28px; height: 25px; vertical-align: top; border-collapse: collapse; text-align: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><a href="https://app.signitic.com/l/ZGJXSFRUVzlrVEE3SCtTUHlNSEFCdz09-L1VPU1JaMVh1WVVycmx2d0s5aFg3Zz09"><img style="width:25px;height:25px;" width="25" height="25" src="https://img.signitic.app/uploads/ffffffffb412_rond_pinterest.png" alt="pinterest"></a></td></tr></tbody></table></div> </td></tr><tr style="color: inherit;"><td style="color: inherit; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1"><table style="width: 100%; border-collapse: separate; font-family: Arial; background: transparent; font-size: 13px; color: rgb(0, 0, 0);" cellspacing="0"><tbody><tr style="height: auto; color: inherit;"><td style="color: inherit; text-align: center; height: 30px; background-color: rgb(255, 209, 0); padding: 10px; white-space: normal; border-width: initial; border-style: initial; border-color: rgb(255, 255, 255);" rowspan="1" data-reply="3" ddirection="3" colspan="1" height="30px"><div style="white-space: normal;"><span style="color: #000000;"><a style="color: #000000;" href="https://alter-recrut.fr/postuler"><span style="font-size: 16px;"><strong>Postuler</strong></span></a></span></div></td><td style="color: inherit; text-align: left; width: 30px; height: 30px; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1" width="30px" height="30px"></td><td style="color: inherit; text-align: center; height: 30px; background-color: rgb(255, 209, 0); padding: 10px; white-space: normal;" rowspan="1" data-reply="3" ddirection="3" colspan="1" height="30px"><div style="white-space: normal;"><span style="color: #000000;"><a style="color: #000000;" href="https://alter-recrut.fr/recruter"><span style="font-size: 16px;"><strong>Recruter</strong></span></a></span></div></td></tr></tbody></table></td></tr></tbody></table></td> </tr> </tbody></table><p style="margin-top: 10px;">`
                req.body.html += "\n\n"
                req.body.html += signature
                const mailOptions = {
                    from: `Expéditeur <${req.user.email}>`,
                    to: req.body.to || "zaptom.pro@gmail.com",
                    subject: req.body.subject || "Sujet",
                    html: req.body.html,
                    // text: req.body.text || "Contenu de l'e-mail en texte",
                };
                const response = await transporter.sendMail(mailOptions);
                response.message = 'Email has been sent'
                response.ok = true
                res.status(200).json(response);
            } catch (error) {
                res.status(500).json({ message: error.message });
            }
        }
    }
}
module.exports = googleController