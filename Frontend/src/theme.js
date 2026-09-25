import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  fonts: {
    heading: `'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`,
  },
  colors: {
    // Primary Signature Color requested by user: #52796F
    brand: {
      50: '#F4F7F5',
      100: '#E5ECE8',
      200: '#CAD7D0',
      300: '#A9BFB5',
      400: '#7E9F94',
      500: '#52796F', // Exact user brand color
      600: '#43645C',
      700: '#344E48',
      800: '#263B36',
      900: '#182724',
      950: '#0E1715',
    },
    sage: {
      50: '#F7FAF8',
      100: '#ECF2EE',
      200: '#D5E2DA',
      300: '#B8CCC1',
      400: '#94B2A3',
      500: '#52796F',
      600: '#416159',
      700: '#324C46',
      800: '#233732',
      900: '#162320',
    },
    forest: {
      50: '#F1F5F3',
      100: '#DEE8E3',
      500: '#354F52',
      700: '#2F3E46',
      800: '#1E2B30',
      900: '#131B1E',
    },
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    fca: {
      50: '#F0F9FF',
      500: '#0284C7',
      600: '#0369A1',
    },
    pra: {
      50: '#FAF5FF',
      500: '#7C3AED',
      600: '#6D28D9',
    },
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#0B1110' : '#FAFCFB',
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#182724',
        letterSpacing: '-0.01em',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      },
      '.markdown-compliance-content': {
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#243330',
        fontSize: '14px',
        lineHeight: '1.7',
      },
      '.markdown-compliance-content p': {
        mb: '12px',
        lineHeight: '1.75',
      },
      '.markdown-compliance-content p:last-child': {
        mb: '0px',
      },
      '.markdown-compliance-content strong': {
        fontWeight: '700',
        color: props.colorMode === 'dark' ? '#52B788' : '#1F3A33',
      },
      '.markdown-compliance-content em': {
        fontStyle: 'italic',
        color: props.colorMode === 'dark' ? '#A3B899' : '#3E5850',
      },
      '.markdown-compliance-content h1, .markdown-compliance-content h2, .markdown-compliance-content h3, .markdown-compliance-content h4': {
        fontWeight: '800',
        color: props.colorMode === 'dark' ? '#F1F5F9' : '#1A2E2A',
        letterSpacing: '-0.01em',
        mt: '16px',
        mb: '8px',
      },
      '.markdown-compliance-content h1': { fontSize: 'lg' },
      '.markdown-compliance-content h2': { fontSize: 'md' },
      '.markdown-compliance-content h3': { fontSize: 'sm' },
      '.markdown-compliance-content h4': { fontSize: 'xs' },
      '.markdown-compliance-content ul': {
        my: '10px',
        pl: '22px',
        listStyleType: 'disc',
      },
      '.markdown-compliance-content ol': {
        my: '10px',
        pl: '22px',
        listStyleType: 'decimal',
      },
      '.markdown-compliance-content li': {
        mb: '6px',
        lineHeight: '1.65',
        pl: '2px',
      },
      '.markdown-compliance-content li::marker': {
        color: '#52796F',
        fontWeight: '700',
      },
      '.markdown-compliance-content blockquote': {
        borderLeft: '3px solid #52796F',
        bg: props.colorMode === 'dark' ? 'rgba(82, 121, 111, 0.12)' : '#F0F6F3',
        my: '14px',
        py: '10px',
        px: '14px',
        borderRadius: 'md',
        fontStyle: 'italic',
        color: props.colorMode === 'dark' ? '#CAD7D0' : '#2F453E',
      },
      '.markdown-compliance-content blockquote p': {
        mb: '0px',
      },
      '.markdown-compliance-content code': {
        bg: props.colorMode === 'dark' ? '#223530' : '#E8EFEA',
        color: props.colorMode === 'dark' ? '#74C69D' : '#2D6A4F',
        px: '6px',
        py: '2px',
        borderRadius: 'md',
        fontSize: '0.85em',
        fontFamily: 'monospace',
        fontWeight: '600',
      },
      '.markdown-compliance-content pre': {
        bg: props.colorMode === 'dark' ? '#111A18' : '#F1F5F3',
        p: '12px',
        borderRadius: 'lg',
        overflowX: 'auto',
        my: '12px',
        fontSize: 'xs',
      },
      '.markdown-compliance-content hr': {
        borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        my: '14px',
      },
      '.markdown-compliance-content table': {
        width: '100%',
        my: 3,
        borderCollapse: 'collapse',
        borderRadius: 'lg',
        overflow: 'hidden',
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? '#263B36' : '#CAD7D0',
        fontSize: 'xs',
      },
      '.markdown-compliance-content th': {
        bg: '#52796F',
        color: 'white',
        p: 2.5,
        fontWeight: '700',
        textAlign: 'left',
        borderBottom: '1px solid',
        borderColor: props.colorMode === 'dark' ? '#344E48' : '#43645C',
      },
      '.markdown-compliance-content td': {
        p: 2.5,
        borderBottom: '1px solid',
        borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#2F3E46',
      },
      '.markdown-compliance-content tr:nth-of-type(even)': {
        bg: props.colorMode === 'dark' ? '#131D1B' : '#F8FAF9',
      },
      '.markdown-compliance-content tr:hover': {
        bg: props.colorMode === 'dark' ? '#1A2926' : '#F0F4F2',
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      variants: {
        solid: {
          bg: '#52796F',
          color: 'white',
          _hover: {
            bg: '#43645C',
            _disabled: {
              bg: '#52796F',
            },
          },
        },
        outline: (props) => ({
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#CAD7D0',
          color: props.colorMode === 'dark' ? '#CAD7D0' : '#344E48',
          _hover: {
            bg: props.colorMode === 'dark' ? '#1A2926' : '#F4F7F5',
            borderColor: '#52796F',
          },
        }),
      },
    },
    Card: {
      baseStyle: (props) => ({
        container: {
          borderRadius: '2xl',
          boxShadow:
            props.colorMode === 'dark'
              ? '0 2px 10px rgba(0, 0, 0, 0.4)'
              : '0 1px 3px 0 rgba(82, 121, 111, 0.08), 0 1px 2px -1px rgba(82, 121, 111, 0.08)',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E2EAE5',
          bg: props.colorMode === 'dark' ? '#141E1C' : 'white',
          color: props.colorMode === 'dark' ? '#E2E8F0' : 'inherit',
          transition: 'background-color 0.2s ease, border-color 0.2s ease',
        },
      }),
    },
    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? '#141E1C' : 'white',
          color: props.colorMode === 'dark' ? '#E2E8F0' : 'inherit',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        },
      }),
    },
    Menu: {
      baseStyle: (props) => ({
        list: {
          bg: props.colorMode === 'dark' ? '#141E1C' : 'white',
          color: props.colorMode === 'dark' ? '#E2E8F0' : '#2F3E46',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
          boxShadow: props.colorMode === 'dark' ? '0 10px 25px rgba(0, 0, 0, 0.6)' : 'xl',
        },
        item: {
          bg: props.colorMode === 'dark' ? '#141E1C' : 'white',
          _hover: {
            bg: props.colorMode === 'dark' ? '#1A2926' : '#F4F7F5',
          },
        },
      }),
    },
    Popover: {
      baseStyle: (props) => ({
        content: {
          bg: props.colorMode === 'dark' ? '#141E1C' : 'white',
          color: props.colorMode === 'dark' ? '#E2E8F0' : 'inherit',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        },
        header: {
          bg: props.colorMode === 'dark' ? '#1A2926' : '#F4F7F5',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        },
        footer: {
          bg: props.colorMode === 'dark' ? '#141E1C' : '#F8FAF9',
          borderColor: props.colorMode === 'dark' ? '#263B36' : '#E5ECE8',
        },
      }),
    },
    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 2.5,
        py: 0.5,
        fontWeight: '700',
        letterSpacing: '0.02em',
      },
    },
  },
});
