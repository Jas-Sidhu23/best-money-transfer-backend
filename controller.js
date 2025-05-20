const express = require('express');
const app = express();
const router = express.Router();
const mysql = require("./connection");
const nodeMailer = require("nodemailer");
// const { error } = require('console');
//const { fields } = require('./middlewares/multer');
// const { json } = require('body-parser');
const helper = require('./helpers/helper');
//const { match } = require('assert');
require('dotenv').config();

/**
 *       Registration
 */

const registration = async (req, res) => {
    try {
        const name = req.body.name;
        const email = req.body.user_email;
        const phoneNo = req.body.phone_no;
        const password = helper.cpassword(req.body.password);
        if(!name) {
            return res.status(400).json({ error: "1", error_message: "Name is required."});
        }
        if (req.body.confirm_password != req.body.password) {
            return res.status(500).json({ error: "1", error_message: 'Password and confirm password does not match.'});
        }
        mysql.query(`SELECT * FROM users WHERE user_email = "${email}" OR phone_no = "${phoneNo}"`, (error, resu) => {
            if (resu.length > 0) {
                return res.status(500).json({ error: "1", error_message: 'An account with this email or phone number already exists.'});
            } else {
                const emailOTP  = Math.floor(1000 + Math.random() * 9000);
                const phoneNoOTP = Math.floor(1000 + Math.random() * 9000);
                mysql.query(
                    `INSERT INTO users (name, user_email, phone_no, password, email_otp, phone_no_otp, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [name, email, phoneNo, password, emailOTP, phoneNoOTP, 1],
                    (error, results) => {
                        if (error) {
                            return res.status(500).json({ error: "1", error_message: 'An error occurred while creating the user.', error });
                          } else {
                            const userId = results.insertId;
                            mysql.query(`SELECT * FROM users WHERE user_id = ${userId}`, (error, result) => {
                                return res.status(200).json({ error: "0", error_message: 'Success', data: result[0]});
                            });
                          }
                    }
                );
            } 
        });
    } catch (err) {
        return res.status(500).json({ error: "1", error_message: 'An unexpected error occurred', details: err });
    }
};

/**
 *        Email and phone number OTP verification for registration
 */

const verifyRegistrationOTP = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const emailOTP = req.body.email_otp;
        const phoneNoOTP = req.body.phone_no_otp;
        if (!emailOTP || !phoneNoOTP) {
            return res.status(500).json({error: "1", error_message: "Please enter each OTP to verify your account."});
        } else if ((emailOTP.toString()).length != 4 || (phoneNoOTP.toString()).length != 4) {
            return res.status(500).json({error: "1", error_message: "The OTP must be 4-digits."});
        }
        mysql.query(`SELECT * FROM users WHERE user_id = "${userId}"`, (error, results) => {
            const emailIsMatch = emailOTP == results[0].email_otp;
            const numberIsMatch = phoneNoOTP == results[0].phone_no_otp;
            if (!emailIsMatch) {
                return res.status(500).json({error: "1", error_message: "Email OTP does not match."});
            } else if (!numberIsMatch) {
                return res.status(500).json({error: "1", error_message: "Phone No. OTP does not match."});
            } else {
                const Token = helper.sendToken(results[0].user_id, 200, res);
                console.log(Token, "jwt tokennnnnnnnnnn");
                const name = (results[0].name).replace(/\s+/g, '');
                const random = Math.floor(10 + Math.random() * 90);
                const randomer = Math.floor(1 + Math.random() * 9);
                const BMTP_id = "BMTP-" + name + random.toString() + userId.toString() + randomer.toString();
                mysql.query(`UPDATE users SET bmtp_id = "${BMTP_id}" WHERE user_id = ${userId}`, (e, resu) => {});
                return res.status(200).json({error: "0", error_message: "Verification Complete", data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'An unexpected error occurred', details: err });
    }
};

/**
 *               Log in
 */

const login = async (req, res) => {
    try {
        const email = req.body.user_email;
        const password = req.body.password
        const hashedPassword = helper.cpassword(password);
        if (!email) {
            return res.status(500).json({error: "1", error_message: "Your email is required."});
        } else if (!password) {
            return res.status(500).json({error: "1", error_message: "Password is required."});
        }
        mysql.query(`SELECT * FROM users WHERE user_email = "${email}"`, (error, results) => {
            if (results.length == 0) {
                return res.status(500).json({error: "1", error_message: "No account with this email exists."});
            } else if (results.length == 1) {
                const isMatch = hashedPassword == results[0].password;
                if (!isMatch) {
                    return res.status(500).json({error: "1", error_message: "Incorrect password."});
                } else {
                    const emailOTP = Math.floor(1000 + Math.random() * 9000);
                    mysql.query(`UPDATE users SET email_otp = "${emailOTP}" WHERE user_email = "${email}"`, (e, result) => {
                        if (e) {
                            return res.status(500).json({error: "1", error_message: "Unable to send OTP."});
                        }
                        return res.status(200).json({error: "0", error_message: "Log in successful.", data: {"user_id" : results[0].user_id, "name" : results[0].name, "email_otp" : emailOTP}});
                        //return res.status(200).json({error: "0", error_message: "Log in successful.", data: result});
                    });
                }
            } else {
                return res.status(500).json({error: "1", error_message: "Duplicate emails detected."});
            }
        });
    } catch (err) {
        return res.status(500).json({ error: 'An unexpected error occurred', details: err });
    }
};

/**
 *             Email OTP verification for Log in
 */

const verifyEmailOTP = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const emailOTP = req.body.email_otp;
        if (!emailOTP) {
            return res.status(500).json({error: "1", error_message: "OTP is required to verify user."});
        } else if ((emailOTP.toString()).length != 4) {
            return res.status(500).json({error: "1", error_message: "The OTP must be 4-digits."});
        }
        mysql.query(`SELECT * FROM users WHERE user_id = "${userId}"`, (error, results) => {
            const isMatch = emailOTP == results[0].email_otp;
            if (!isMatch) {
                return res.status(500).json({error: "1", error_message: "OTP does not match."});
            } else {
                const Token = helper.sendToken(results[0].user_id, 200, res);
                console.log(Token, "jwt tokennnnnnnnnnn");
                return res.status(200).json({error: "0", error_message: "Verification Complete", data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred', details: err });
    }
};

/**
 *         Generate and send OTP to email for forgot password
 */

const forgotPassword = async (req, res) => {
    try {
        const email = req.body.user_email;
        if (!email) {
            return res.status(500).json({error: "1", error_message: "Email is required."});
        }
        mysql.query(`SELECT * FROM users WHERE user_email = "${email}"`, (error, results) => {
            if (results.length == 0) {
                return res.status(500).json({error: "1", error_message: "No account with this email exists."});
            }  
            if (results.length == 1) {
                const forgotpwOTP = Math.floor(1000 + Math.random() * 9000);
                const session = Math.floor(1000000 + Math.random() * 9000000);
                mysql.query(`UPDATE users SET forgot_pw_otp = "${forgotpwOTP}", session = "${session}" WHERE user_email = "${email}"`, (error, result) => {
                    if(error)
                    {
                        return res.status(500).json({error: "1", error_message: "Unable to send OTP."});
                    }
                    return res.status(200).json({error: "0", error_message: "OTP successfully sent to email.", data : {"user_id" : results[0].user_id, "session" : session}});
                });
            } else {
                return res.status(500).json({error: "1", error_message: "Duplicate emails detected"});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred', details: err });
    }
};

/**
 *            Verify forgot password OTP
 */

const verifyForgotPw = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const session = req.body.session;
        const forgotPwOTP = req.body.forgot_pw_otp;
        mysql.query(`SELECT * FROM users WHERE user_id = "${userId}"`, (error, results) => {
            if (session != results[0].session) {
                return res.status(500).json({error: "1", error_message: "Session invalid."});
            }
            if (!forgotPwOTP) {
                return res.status(500).json({error: "1", error_message: "OTP is required to verify user."});
            }
            const isMatch = forgotPwOTP == results[0].forgot_pw_otp;
            if (!isMatch) {
                return res.status(500).json({error: "1", error_message: "OTP does not match."});
            } else {
                return res.status(200).json({error: "0", error_message: "Verification Complete", data: {"user_id" : userId, "session" : session}});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

/**
 *              Change password
 */

const changePassword = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const session = req.body.session;
        const newpassword     = helper.cpassword(req.body.newpassword);
        const confirmpassword = helper.cpassword(req.body.confirmpassword);
        mysql.query(`SELECT * FROM users WHERE user_id = "${userId}"`, (error, results) => {
            if (session != results[0].session) {
                return res.status(500).json({error: "1", error_message: "Session invalid."});
            }
            if (!newpassword || !confirmpassword) {
                return res.status(500).json({error: "1", error_message: "Pleas fill out all fields."});
            }
            if (newpassword != confirmpassword) {
                return res.status(500).json({error: "1", error_message: "New Password and Confirm Password fields do not match."});
            } else {
                mysql.query(`UPDATE users SET password = "${newpassword}" WHERE user_id = "${userId}"` , (err, result) => {
                    return res.status(200).json({error: "0", error_message: "Password successfully changed.",  data: {"user_id" : userId, "session" : session}});
                });
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

/**
 *                Add Card
 */

const addCard = async(req, res) => {
    try {
        const userId = req.body.user_id;
        const company = req.body.company;
        const cardNumber = req.body.card_number;
        const bank = req.body.bank;
        const expireDate = req.body.expire_date;
        const cvc = req.body.cvc;
        const cardholderName = req.body.cardholder_name;
        const address = req.body.address;
        if (!company || !cardNumber || !bank || !expireDate || !cardholderName || !address || !cvc) {
            return res.status(500).json({error: "1", error_message: "Please fill out all fields correctly."});
        }
        mysql.query(`SELECT * FROM cards WHERE user_id = "${userId}" AND card_number = "${cardNumber}"`, (error, results) => {
            if(results.length > 0) {
                return res.status(500).json({error: "1", error_message: "This card already exists on your profile."});
            } else {
                mysql.query(`INSERT INTO cards (user_id, company, card_number, bank, expire_date, cvc, cardholder_name, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                [userId, company, cardNumber, bank, expireDate, cvc, cardholderName, address, 1],
                (error, result) => {
                    if (error) {
                        return res.status(500).json({error: "1", error_message: "An error occurred while trying to add card."});
                    }
                    return res.status(200).json({error: "0", error_message: "Card successfully added.", data: result[0]})
                });
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    } 
};

const getCards = async (req, res) => {
    try {
        const userId = req.body.user_id;
        mysql.query(`SELECT * FROM cards WHERE user_id = ${userId} AND is_active = ${1}`, (error, results) => {
            if (results.length == 0) {
                  return res.status(500).json({error:"1", error_message: 'No cards on file.'});
            } else {
                return res.status(200).json({ error: '0', error_message: 'Success', data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const getCard = async (req, res) => {
    try {
        const cardId = req.body.card_id;
        mysql.query(`SELECT * FROM cards WHERE card_id = ${cardId}`, (error, result) => {
            if (result.length != 1) {
                return res.status(500).json({error:"1", error_message: 'Quantity of cards is not 1'});
          } else {
              return res.status(200).json({ error: '0', error_message: 'Success', data: result[0]});
          }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const editCard = async (req, res) => {
    try {
        const cardId = req.body.card_id;
        const cardNumber = req.body.card_number;
        const expireDate = req.body.expire_date;
        const cvc = req.body.cvc;
        const bank = req.body.bank;
        const company = req.body.company;
        const cardholderName = req.body.cardholder_name;
        const address = req.body.address;
        if (!company || !cardNumber || !bank || !expireDate || !cardholderName || !address || !cvc) {
            return res.status(500).json({error: "1", error_message: "Please fill out all fields correctly."});
        }
        mysql.query(`UPDATE cards SET card_number = "${cardNumber}", expire_date = "${expireDate}", cvc = "${cvc}", bank = "${bank}", company = "${company}", cardholder_name = "${cardholderName}", address = "${address}" WHERE card_id = "${cardId}"`,
            (error, result) => {
                if (error) {
                    return res.status(500).json({error: "1", error_message: 'An error occurred while updating the card.', details: err });
                }
                return res.status(200).json({error: "0", error_message: "Information successfully updated",  data: result});
            });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const deleteCard = async (req, res) => {
    try {
        const cardId = req.body.card_id;
        mysql.query(`UPDATE cards SET is_active = ${0} WHERE card_id = "${cardId}"`, (error, results) => {
            return res.status(200).json({ error: '0', error_message: 'Card deleted from your profile.', posts: results });
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const getUser = async (req, res) => {
    try {
        const userId = req.body.user_id;
        mysql.query(`SELECT * FROM users WHERE user_id = ${userId}`, (error, result) => {
            if (result.length != 1) {
                return res.status(500).json({error:"1", error_message: 'Quantity of cards is not 1'});
            } else {
              return res.status(200).json({ error: '0', error_message: 'Success', data: result[0]});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const completeProfile = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const name = req.body.name;
        const email = req.body.user_email;
        const phoneNo = req.body.phone_no;
        const address = req.body.address;
        const state = req.body.state;
        const pincode = req.body.pincode;
        const gender = req.body.gender;
        const dob = req.body.dob;
        const transactionPin = req.body.transaction_pin;
        let profileImage = null;
        if (req.image && req.image.length > 0) {
            profileImage = req.image[0].originalname;
        }
        if (profileImage == null) {
            profileImage = "no_pfp.png";
        }
        if (!name || !email || !phoneNo || !address || !state || !pincode || !gender || !dob || !transactionPin) {
            return res.status(500).json({error: "1", error_message: "Please fill out all fields correctly."});
        }
        mysql.query(`UPDATE users SET name = "${name}", user_email = "${email}", phone_no = "${phoneNo}", address = "${address}", state = "${state}", pincode = "${pincode}", gender = "${gender}", dob = "${dob}", transaction_pin = ${transactionPin}, profile_img = "${profileImage}" WHERE user_id = "${userId}"`,
            (error, result) => {
                if (error) {
                    return res.status(500).json({error: "1", error_message: 'An error occurred while updating the card.', details: error});
                }
                return res.status(200).json({error: "0", error_message: "Profile complete!",  data: result});
            });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const getPfp = async (req, res) => {
    try { 
        const userId = req.body.user_id;
        mysql.query(`SELECT * FROM users WHERE user_id = "${userId}"`, (error, results) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'An error occurred while getting profile.', details: error});
            }
            if (results.length != 1) {
                return res.status(500).json({error: "1", error_message: 'The results found are not one.', details: error});
            } else {
                return res.status(200).json({error: "0", error_message: "Got profile",  data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const searchBMTP_id = async (req, res) => {
    try {
        const BMTP_id = req.body.bmtp_id;
        mysql.query(`SELECT * FROM users WHERE bmtp_id LIKE "%${BMTP_id}%"`, (error, results) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'An error occurred while searching.', details: error});
            } else {
                return res.status(200).json({error: "0", error_message: "successful search",  data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const verifyTransaction = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const transactionPin = req.body.transaction_pin;
        if (!transactionPin) {
            return res.status(500).json({error: "1", error_message: "Transaction pin is required to verify transfer."});
        }
        mysql.query(`SELECT * FROM users WHERE user_id = ${userId}`, (error, results) => {
            if (results.length == 0) {
                return res.status(500).json({error: "1", error_message: 'No user found', details: error});
            } 
            if (error) {
                return res.status(500).json({error: "1", error_message: 'An error occurred while selecting the user', details: error});
            }
            const isMatch = transactionPin == results[0].transaction_pin;
            if (!isMatch) {
                return res.status(500).json({error: "1", error_message: 'Incorrect Transaction Pin', details: error});
            } else {
                return res.status(200).json({error: "0", error_message: "Transfer verification complete",  data: results});
            }
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const addToWallet = async (req, res) => {
    try {
        const userId = req.body.user_id;
        const amount = req.body.amount;
        mysql.query(`SELECT * FROM users WHERE user_id = ${userId}`, (error, results) => {
            if (results.length == 0) {
                return res.status(500).json({error: "1", error_message: 'No user found', details: error});
            } 
            if (error) {
                return res.status(500).json({error: "1", error_message: 'An error occurred while selecting the user', details: error});
            }
            const walletBalance = results[0].wallet_balance + amount;
            mysql.query(`UPDATE users SET wallet_balance = ${walletBalance} WHERE user_id = ${userId}`, (e, result) => {
                if (e) {
                    return res.status(500).json({error: "1", error_message: 'An error occurred while updating', details: error});
                }
                return res.status(200).json({error: "0", error_message: "Money Transferred Successfully",  data: result});
            });
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const wtTransaction = async (req, res) => {
    try {
        const senderId = req.body.sender_id;
        const recipientId = req.body.recipient_id;
        const amount = req.body.amount;
        const note = req.body.note;
        if (!amount) {
            return res.status(500).json({error: "1", error_message: 'Please enter the amount you would like to transfer.'});
        } 
        if (!note) {
            return res.status(500).json({error: "1", error_message: 'Please enter a note for the recipient.'});
        }
        mysql.query(`INSERT INTO transactions (sender_id, recipient_id, amount, note) VALUES (?, ?, ?, ?)`,
            [senderId, recipientId, amount, note],
            (error, result) => {
                if (error) {
                    return res.status(500).json({error: "1", error_message: 'Error while inserting transaction', details: error});
                } 
                return res.status(200).json({error: "0", error_message: "Transaction successfully added.",  data: result});
            });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const deleteTransaction = async (req, res) => {
    try {
        const transactionId = req.body.transaction_id;
        mysql.query(`DELETE FROM transactions WHERE transaction_id = ${transactionId}`, (error, result) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'Error while deleting transaction.', details: error});
            }
            return res.status(200).json({error: "0", error_message: "Transaction deleted",  data: result});
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const getTransaction = async (req, res) => {
    try {
        const transactionId = req.body.transaction_id;
        mysql.query(`SELECT * FROM transactions WHERE transaction_id = ${transactionId}`, (error, result) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'Error while getting transaction.', details: error});
            }
            if (result.length != 1) {
                return res.status(500).json({error: "1", error_message: 'Transactions found is not 1', details: error});
            }
            return res.status(200).json({error: "0", error_message: "Success",  data: result[0]});
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const walletTransfer = async (req, res) => {
    try {
        const transactionId = req.body.transaction_id;
        mysql.query(`SELECT * FROM transactions WHERE transaction_id = ${transactionId}`, (error, results) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'Error while getting transaction.', details: error});
            }
            if (results.length != 1) {
                return res.status(500).json({error: "1", error_message: 'Transaction length found is not = 1', details: error});
            }
            const senderId = results[0].sender_id;
            const recipientId = results[0].recipient_id;
            mysql.query(`SELECT * FROM users WHERE user_id in (${senderId},${recipientId}) ORDER BY user_id = ${senderId} DESC`, (e, result) => {
                if (e) {
                    return res.status(500).json({error: "1", error_message: 'Error while getting transaction.', details: e});
                }
                if (result.length != 2) {
                    return res.status(500).json({error: "1", error_message: 'Users length found is not = 2', details: e});
                }
                const senderBalance = result[0].wallet_balance - results[0].amount;
                const recipientBalance = result[1].wallet_balance + results[0].amount;
                if (senderBalance < 0) {
                    return res.status(500).json({error: "1", error_message: 'Insufficient funds in wallet.'});
                } else {
                    mysql.query(`UPDATE users SET wallet_balance = ${senderBalance} WHERE user_id = ${senderId}`, (senderErr, senderRes) => {
                        if (senderErr) {
                            return res.status(500).json({error: "1", error_message: 'Error while updating sender balance.', details: senderErr});
                        }
                    });
                }
                mysql.query(`UPDATE users SET wallet_balance = ${recipientBalance} WHERE user_id = ${recipientId}`, (recipientErr, recipientRes) => {
                    if (recipientErr) {
                        return res.status(500).json({error: "1", error_message: 'Error while updating recipient balance.', details: recipientErr});
                    }
                    return res.status(200).json({error: "0", error_message: "Wallet transfer successful!",  data: recipientRes});
                });
            });
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};

const getRecentActivity = async (req, res) => {
    try {
        const userId = req.body.user_id;
        mysql.query(`SELECT * FROM transactions WHERE sender_id = ${userId} OR recipient_id = ${userId} ORDER BY transaction_id DESC`, (error, results) => {
            if (error) {
                return res.status(500).json({error: "1", error_message: 'Error while getting activity', details: senderErr});
            }
            return res.status(200).json({error: "0", error_message: "got activity",  data: results});
        });
    } catch (err) {
        return res.status(500).json({error: "1", error_message: 'An unexpected error occurred.', details: err });
    }
};




module.exports = {
    registration, 
    verifyRegistrationOTP, 
    login,
    verifyEmailOTP,
    forgotPassword,
    verifyForgotPw,
    changePassword,
    addCard,
    getCards,
    getCard,
    editCard,
    deleteCard,
    getUser,
    completeProfile,
    getPfp,
    searchBMTP_id,
    verifyTransaction,
    addToWallet,
    wtTransaction,
    deleteTransaction,
    getTransaction,
    walletTransfer,
    getRecentActivity,
};