/** @type {import('next').NextConfig} */
const nextConfig = {
  // ඔබගේ අනෙකුත් settings...

  eslint: {
    // අවවාදයයි: මෙය කිරීමෙන් ESLint දෝෂ තිබුණත් build එක complete වීමට ඉඩ දෙයි.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
