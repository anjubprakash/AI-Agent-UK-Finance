import React from 'react';
import {
  Box,
  Flex,
  Container,
  Heading,
  Text,
  Button,
  SimpleGrid,
  HStack,
  VStack,
  Badge,
  Divider,
} from '@chakra-ui/react';
import {
  Building2,
  TrendingUp,
  Briefcase,
  Globe,
  PhoneCall,
  ArrowUpRight,
  Lock,
  CheckCircle2,
  CreditCard,
  PieChart,
} from 'lucide-react';
import { ComplianceWidget } from '../components/widget/ComplianceWidget.jsx';

/**
 * /test — Simulated External 3rd-Party Website ("Albion Crest Wealth & Retail Banking UK")
 * Created specifically to demonstrate and test the embedded AI Compliance Widget
 * on a completely separate website layout.
 */
export const TestExternalWebsite = () => {
  return (
    <Box minH="150vh" bg="#F8FAFC" color="#0F172A" fontFamily="Inter, system-ui, sans-serif">
      {/* External Website Top Utility Bar */}
      <Box bg="#0F172A" color="#94A3B8" py={2} px={{ base: 4, md: 10 }} fontSize="xs">
        <Container maxW="1200px">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={2}>
            <HStack spacing={4}>
              <Text color="#E2E8F0" fontWeight="600">
                Albion Crest Financial Group plc (London, UK)
              </Text>
              <Text display={{ base: 'none', md: 'block' }}>
                FTSE 100 Wealth, Mortgages & Commercial Banking Portal
              </Text>
            </HStack>
            <HStack spacing={4}>
              <Badge bg="rgba(59, 130, 246, 0.2)" color="#93C5FD" px={2} py={0.5} borderRadius="full">
                External Website Test Page (/test)
              </Badge>
              <Text>BoE Base Rate: 5.00%</Text>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* External Website Main Navigation Header */}
      <Box bg="white" borderBottom="1px solid #E2E8F0" position="sticky" top={0} zIndex={100}>
        <Container maxW="1200px" py={4}>
          <Flex justify="space-between" align="center">
            <HStack spacing={3}>
              <Flex
                w="40px"
                h="40px"
                borderRadius="10px"
                bg="#1E3A8A"
                color="white"
                align="center"
                justify="center"
              >
                <Building2 size={22} />
              </Flex>
              <Box>
                <Text fontWeight="800" fontSize="lg" color="#0F172A" letterSpacing="-0.02em" lineHeight="1.1">
                  ALBION CREST BANK
                </Text>
                <Text fontSize="11px" color="#64748B" fontWeight="500">
                  UK Retail Mortgages, Treasury & Wealth Advisory
                </Text>
              </Box>
            </HStack>

            <HStack spacing={7} display={{ base: 'none', md: 'flex' }} fontSize="sm" fontWeight="600" color="#334155">
              <Text cursor="pointer" _hover={{ color: '#1E3A8A' }}>Retail Banking</Text>
              <Text cursor="pointer" _hover={{ color: '#1E3A8A' }}>Commercial Lending</Text>
              <Text cursor="pointer" _hover={{ color: '#1E3A8A' }}>Wealth & ISA</Text>
              <Text cursor="pointer" _hover={{ color: '#1E3A8A' }}>Mortgage Products</Text>
              <Text cursor="pointer" _hover={{ color: '#1E3A8A' }}>Investor Relations</Text>
            </HStack>

            <HStack spacing={3}>
              <Button size="sm" variant="outline" borderColor="#CBD5E1" color="#1E293B">
                Advisor Portal
              </Button>
              <Button size="sm" bg="#1E3A8A" color="white" _hover={{ bg: '#172554' }}>
                Online Banking
              </Button>
            </HStack>
          </Flex>
        </Container>
      </Box>

      {/* Hero Banner */}
      <Box bg="linear-gradient(135deg, #0F172A 0%, #1E3A8A 100%)" color="white" py={{ base: 12, md: 16 }}>
        <Container maxW="1200px">
          <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={10} alignItems="center">
            <VStack align="start" spacing={5} gridColumn={{ base: 'span 1', lg: 'span 7' }}>
              <Badge bg="rgba(255,255,255,0.14)" color="#BFDBFE" px={3} py={1} borderRadius="full" fontSize="xs">
                EXTERNAL WEBSITE INTEGRATION DEMO (/test)
              </Badge>
              <Heading size="xl" fontWeight="800" lineHeight="1.2">
                Modern UK Private & Retail Banking Built for Financial Confidence
              </Heading>
              <Text fontSize="md" color="#CBD5E1" lineHeight="1.7">
                This is a completely separate website page (<CodeBadge>/test</CodeBadge>) representing an external financial institution or company website where the <strong>UK Financial Rules AI Compliance Widget</strong> is integrated in the bottom-right corner.
              </Text>
              <HStack spacing={4} pt={2}>
                <Button
                  size="md"
                  bg="#3B82F6"
                  color="white"
                  _hover={{ bg: '#2563EB' }}
                  rightIcon={<ArrowUpRight size={17} />}
                >
                  Explore Mortgage Rates
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  borderColor="whiteAlpha.400"
                  color="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  Wealth Portfolio Guide
                </Button>
              </HStack>
            </VStack>

            <Box
              gridColumn={{ base: 'span 1', lg: 'span 5' }}
              bg="rgba(255, 255, 255, 0.08)"
              backdropFilter="blur(10px)"
              border="1px solid rgba(255, 255, 255, 0.16)"
              borderRadius="20px"
              p={6}
            >
              <Text fontSize="xs" fontWeight="700" color="#93C5FD" textTransform="uppercase" mb={3}>
                Live UK Treasury & Product Desk
              </Text>
              <VStack spacing={3.5} align="stretch">
                <Flex justify="space-between" p={3} bg="rgba(15, 23, 42, 0.55)" borderRadius="12px">
                  <Box>
                    <Text fontSize="sm" fontWeight="700">2-Year Fixed Residential Mortgage</Text>
                    <Text fontSize="xs" color="#94A3B8">60% LTV • Regulated MCOB Product</Text>
                  </Box>
                  <Text fontSize="lg" fontWeight="800" color="#60A5FA">4.49% APRC</Text>
                </Flex>
                <Flex justify="space-between" p={3} bg="rgba(15, 23, 42, 0.55)" borderRadius="12px">
                  <Box>
                    <Text fontSize="sm" fontWeight="700">Premier Cash ISA (Flexible)</Text>
                    <Text fontSize="xs" color="#94A3B8">FSCS Protected up to £85,000</Text>
                  </Box>
                  <Text fontSize="lg" fontWeight="800" color="#34D399">4.85% AER</Text>
                </Flex>
                <Flex justify="space-between" p={3} bg="rgba(15, 23, 42, 0.55)" borderRadius="12px">
                  <Box>
                    <Text fontSize="sm" fontWeight="700">SME Revolving Credit Facility</Text>
                    <Text fontSize="xs" color="#94A3B8">Corporate & Commercial Banking</Text>
                  </Box>
                  <Text fontSize="lg" fontWeight="800" color="#FBBF24">BoE + 1.75%</Text>
                </Flex>
              </VStack>
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* External Website Body Content (Scrollable to test scroll-lock when widget opens) */}
      <Container maxW="1200px" py={14}>
        <VStack align="start" spacing={2} mb={8}>
          <Text fontSize="xs" fontWeight="800" color="#1E3A8A" textTransform="uppercase" letterSpacing="0.06em">
            Our Financial Divisions
          </Text>
          <Heading size="lg" color="#0F172A">
            Banking & Investment Services Across the United Kingdom
          </Heading>
          <Text fontSize="sm" color="#64748B">
            Click the floating <strong>"Ask UK Compliance AI"</strong> button in the bottom-right corner to test the embedded widget on this page. Notice how the background dims and locks scrolling while the widget is open.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={12}>
          <Box p={6} bg="white" borderRadius="16px" border="1px solid #E2E8F0" boxShadow="0 4px 12px rgba(15,23,42,0.03)">
            <Flex w="42px" h="42px" borderRadius="10px" bg="#EFF6FF" color="#1D4ED8" align="center" justify="center" mb={4}>
              <CreditCard size={20} />
            </Flex>
            <Heading size="sm" mb={2}>Retail & Consumer Lending</Heading>
            <Text fontSize="sm" color="#64748B" lineHeight="1.6">
              Personal credit cards, overdraft facilities, and regulated consumer credit products structured under UK Consumer Duty standards.
            </Text>
          </Box>

          <Box p={6} bg="white" borderRadius="16px" border="1px solid #E2E8F0" boxShadow="0 4px 12px rgba(15,23,42,0.03)">
            <Flex w="42px" h="42px" borderRadius="10px" bg="#F0FDF4" color="#15803D" align="center" justify="center" mb={4}>
              <PieChart size={20} />
            </Flex>
            <Heading size="sm" mb={2}>Discretionary Wealth Management</Heading>
            <Text fontSize="sm" color="#64748B" lineHeight="1.6">
              Tailored multi-asset portfolios, pension drawdown strategies, and CASS-segregated client money custody accounts.
            </Text>
          </Box>

          <Box p={6} bg="white" borderRadius="16px" border="1px solid #E2E8F0" boxShadow="0 4px 12px rgba(15,23,42,0.03)">
            <Flex w="42px" h="42px" borderRadius="10px" bg="#FEF3C7" color="#B45309" align="center" justify="center" mb={4}>
              <Briefcase size={20} />
            </Flex>
            <Heading size="sm" mb={2}>Corporate Governance & Treasury</Heading>
            <Text fontSize="sm" color="#64748B" lineHeight="1.6">
              FX hedging, trade finance, and senior management compliance oversight for institutional clients across London and Edinburgh.
            </Text>
          </Box>
        </SimpleGrid>

        <Divider my={10} borderColor="#E2E8F0" />

        {/* Extra content section so the page has vertical scroll to verify scroll lock */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box p={7} bg="white" borderRadius="16px" border="1px solid #E2E8F0">
            <HStack spacing={2.5} mb={3}>
              <TrendingUp size={19} color="#1E3A8A" />
              <Heading size="sm">Q3 2026 UK Economic & Regulatory Outlook</Heading>
            </HStack>
            <Text fontSize="sm" color="#475569" lineHeight="1.7">
              Albion Crest Bank maintains a Common Equity Tier 1 (CET1) ratio of 15.4%, well above PRA capital buffer thresholds. All retail product distribution channels undergo annual fair-value assessments in accordance with PROD 4 and PRIN 2A guidelines.
            </Text>
          </Box>

          <Box p={7} bg="white" borderRadius="16px" border="1px solid #E2E8F0">
            <HStack spacing={2.5} mb={3}>
              <Lock size={19} color="#1E3A8A" />
              <Heading size="sm">Customer Protection & Dispute Resolution</Heading>
            </HStack>
            <Text fontSize="sm" color="#475569" lineHeight="1.7">
              Our dedicated UK client relations desk resolves complaints in strict adherence to FCA DISP time limits, with full Financial Ombudsman Service (FOS) referral transparency.
            </Text>
          </Box>
        </SimpleGrid>
      </Container>

      {/* Embedded AI Compliance Widget Mounted on This External Website */}
      <ComplianceWidget
        mode="floating"
        defaultOpen={false}
        title="UK Financial Rules AI"
        buttonLabel="Ask UK Compliance AI"
      />
    </Box>
  );
};

const CodeBadge = ({ children }) => (
  <Box
    as="span"
    px={2}
    py={0.5}
    bg="rgba(255,255,255,0.16)"
    borderRadius="6px"
    fontFamily="monospace"
    fontSize="xs"
    color="#93C5FD"
  >
    {children}
  </Box>
);
