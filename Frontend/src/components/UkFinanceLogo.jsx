import React from 'react';
import { Box, HStack, VStack, Text } from '@chakra-ui/react';

export const UkFinanceLogo = ({ size = 'md', showText = true, isDark = false }) => {
  const iconSizes = {
    sm: 30,
    md: 38,
    lg: 48,
  };

  const dim = iconSizes[size] || 38;

  return (
    <HStack spacing={3} align="center" cursor="pointer">
      {/* Precision Vector Shield Logo with #52796F Sage Theme */}
      <Box position="relative" w={`${dim}px`} h={`${dim}px`} flexShrink={0}>
        <svg
          width={dim}
          height={dim}
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Primary Shield Gradient with #52796F */}
            <linearGradient id="sageShieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#52796F" />
              <stop offset="60%" stopColor="#354F52" />
              <stop offset="100%" stopColor="#2F3E46" />
            </linearGradient>

            {/* Subtle Metallic Accent */}
            <linearGradient id="sageBorder" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#84A98C" />
              <stop offset="50%" stopColor="#CAD2C5" />
              <stop offset="100%" stopColor="#52796F" />
            </linearGradient>
          </defs>

          {/* Outer Shield */}
          <path
            d="M24 4L7 11V22C7 32.5 14.2 42.1 24 44C33.8 42.1 41 32.5 41 22V11L24 4Z"
            fill="url(#sageShieldGrad)"
            stroke="url(#sageBorder)"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />

          {/* Scales of Justice Beam */}
          <line
            x1="14"
            y1="20"
            x2="34"
            y2="20"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Center Pillar */}
          <line
            x1="24"
            y1="13"
            x2="24"
            y2="34"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Pillar Base */}
          <path
            d="M19 34H29"
            stroke="#CAD2C5"
            strokeWidth="2.5"
            strokeLinecap="round"
          />

          {/* Left Scale Pan */}
          <path
            d="M12 25.5C12 27.5 14.2 29 16.5 29C18.8 29 21 27.5 21 25.5H12Z"
            fill="#CAD2C5"
          />
          <line x1="16.5" y1="20" x2="16.5" y2="25.5" stroke="#FFFFFF" strokeWidth="1.2" />

          {/* Right Scale Pan */}
          <path
            d="M27 25.5C27 27.5 29.2 29 31.5 29C33.8 29 36 27.5 36 25.5H27Z"
            fill="#CAD2C5"
          />
          <line x1="31.5" y1="20" x2="31.5" y2="25.5" stroke="#FFFFFF" strokeWidth="1.2" />

          {/* Top Crown Motif */}
          <circle cx="24" cy="11" r="2.2" fill="#CAD2C5" />
        </svg>
      </Box>

      {/* Brand Typography */}
      {showText && (
        <VStack align="start" spacing={0} justify="center">
          <Text
            fontSize={size === 'lg' ? '21px' : size === 'sm' ? '15px' : '18px'}
            fontWeight="900"
            letterSpacing="-0.02em"
            color={isDark ? 'white' : '#2F3E46'}
            lineHeight="1.2"
            whiteSpace="nowrap"
          >
            UK FINANCIAL RULES
          </Text>
          <Text
            fontSize={size === 'lg' ? '11px' : size === 'sm' ? '8.5px' : '10px'}
            fontWeight="700"
            color={isDark ? '#CAD2C5' : '#52796F'}
            letterSpacing="0.05em"
            textTransform="uppercase"
            lineHeight="1.2"
            whiteSpace="nowrap"
          >
            FCA & PRA Compliance Assistant
          </Text>
        </VStack>
      )}
    </HStack>
  );
};
