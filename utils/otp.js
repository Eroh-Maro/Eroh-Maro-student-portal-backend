import bcrypt from "bcrypt";

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const hashOTP = async (otp) => {
  return bcrypt.hash(otp, 10);
};