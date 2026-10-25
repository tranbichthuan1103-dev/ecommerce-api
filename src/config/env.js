import 'dotenv/config';

const REQUIRED_ENV_VARS = [
  'PORT',
  'NODE_ENV',
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
];

const WEAK_SECRETS = new Set([
  'secret',
  'jwt_secret',
  'default_dev_secret_key',
  'your_super_secret_jwt_key_here',
  'replace_with_a_strong_random_secret_at_least_32_chars',
  'changeme',
  '123456',
]);

export const validateEnv = () => {
  // 1. Kiểm tra các biến môi trường bắt buộc
  const missingVars = REQUIRED_ENV_VARS.filter((key) => {
    const value = process.env[key];
    return value === undefined || value.trim() === '';
  });

  if (missingVars.length > 0) {
    console.error(
      `[Config Error] Thiếu các biến môi trường bắt buộc: ${missingVars.join(', ')}.\n` +
        'Vui lòng tạo file .env từ .env.example và điền đầy đủ thông tin cấu hình.'
    );
    process.exit(1);
  }

  // 2. Kiểm tra tính hợp lệ của PORT
  const port = Number(process.env.PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('[Config Error] Biến môi trường PORT phải là số nguyên hợp lệ (1 - 65535).');
    process.exit(1);
  }

  // 3. Kiểm tra độ mạnh của JWT_SECRET (không in giá trị JWT_SECRET ra log)
  const jwtSecret = process.env.JWT_SECRET.trim();
  const isWeakSecret =
    jwtSecret.length < 32 || WEAK_SECRETS.has(jwtSecret.toLowerCase());

  if (isWeakSecret) {
    console.error(
      '[Config Error] JWT_SECRET không đủ an toàn (yêu cầu tối thiểu 32 ký tự và không dùng giá trị mặc định/ví dụ).'
    );
    process.exit(1);
  }

  return {
    nodeEnv: process.env.NODE_ENV.trim(),
    port,
    databaseUrl: process.env.DATABASE_URL.trim(),
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN.trim(),
  };
};

export const env = validateEnv();
