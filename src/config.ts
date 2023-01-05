import { registerAs } from '@nestjs/config';

export default registerAs('config', () => {
  return {
    jwtSecret: process.env.JWT_SECRET,
  };
});
