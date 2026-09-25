import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
  Flex,
  Icon,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { UkFinanceLogo } from '../components/UkFinanceLogo.jsx';
import {
  MessageSquare,
  LayoutDashboard,
  ShieldCheck,
  BookOpen,
  Scale,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Search,
  FileCheck,
} from 'lucide-react';

export const Home = () => {
  const { user, isAdmin, isEmployee, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const pageBg = useColorModeValue('#FFFFFF', '#0B1110');
  const heroBg = useColorModeValue('linear-gradient(180deg, #F4F7F5 0%, #FFFFFF 100%)', 'linear-gradient(180deg, #111A18 0%, #0B1110 100%)');
  const borderColor = useColorModeValue('#E5ECE8', '#263B36');
  const badgePillBg = useColorModeValue('#FFFFFF', '#141E1C');
  const badgePillBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const subHeadingColor = useColorModeValue('#52796F', '#84A98C');
  const previewCardBg = useColorModeValue('#FFFFFF', '#141E1C');
  const previewCardBorder = useColorModeValue('#D5E2DA', '#263B36');
  const chatBubbleAiBg = useColorModeValue('#F7FAF8', '#182724');
  const chatBubbleAiBorder = useColorModeValue('#E5ECE8', '#263B36');
  const cardBg = useColorModeValue('#FFFFFF', '#141E1C');
  const cardBorder = useColorModeValue('#E5ECE8', '#263B36');
  const cardBadgeBg = useColorModeValue('#F4F7F5', '#1A2926');
  const cardBadgeBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const pillarsBg = useColorModeValue('#F7FAF8', '#0F1715');
  const pillarCardBg = useColorModeValue('#FFFFFF', '#141E1C');
  const iconContainerBg = useColorModeValue('#F4F7F5', '#1D2E2B');
  const mutedTextColor = useColorModeValue('#64748B', '#94A3B8');
  const isDark = useColorModeValue(false, true);

  const sampleRules = [
    {
      code: 'FCA PRIN',
      title: 'Principles for Businesses',
      desc: '12 foundational principles including Integrity, Skill/Care/Diligence, and the Consumer Duty (PRIN 2A).',
      tag: 'Core Principle',
    },
    {
      code: 'FCA FIT',
      title: 'Fit and Proper Test',
      desc: 'Statutory criteria for assessing honesty, integrity, competence, capability, and financial soundness.',
      tag: 'SMCR Standards',
    },
    {
      code: 'FCA SYSC',
      title: 'Senior Management & Systems',
      desc: 'Governance, risk management systems, operational resilience, and compliance apportionment controls.',
      tag: 'Governance',
    },
    {
      code: 'FCA DISP & COBS',
      title: 'Conduct & Dispute Resolution',
      desc: 'Complaints handling standards, dispute resolution procedures, and retail client conduct rules.',
      tag: 'Client Protection',
    },
  ];

  return (
    <Box bg={pageBg} minH="100vh">
      {/* Hero Section */}
      <Box
        bg={heroBg}
        pt={{ base: 12, md: 20 }}
        pb={{ base: 16, md: 24 }}
        borderBottom="1px solid"
        borderColor={borderColor}
        position="relative"
        overflow="hidden"
      >
        <Container maxW="container.xl">
          <VStack spacing={8} textAlign="center" align="center">
            {/* Pill Badge */}
            <HStack
              spacing={2}
              px={3.5}
              py={1.5}
              bg={badgePillBg}
              border="1.5px solid"
              borderColor={badgePillBorder}
              borderRadius="full"
              boxShadow="0 1px 3px 0 rgba(82, 121, 111, 0.1)"
            >
              <Box w="7px" h="7px" borderRadius="full" bg="#52796F" />
              <Text fontSize="12px" fontWeight="800" color="#52796F" letterSpacing="0.04em" textTransform="uppercase">
                Official UK Regulatory Compliance Intelligence
              </Text>
            </HStack>

            {/* Main Headline */}
            <VStack spacing={4} maxW="850px">
              <Heading
                fontSize={{ base: '32px', md: '52px' }}
                fontWeight="900"
                letterSpacing="-0.03em"
                lineHeight="1.15"
                color={headingColor}
              >
                Instant, Grounded Answers for{' '}
                <Text as="span" color="#52796F">
                  UK Financial Rules
                </Text>
              </Heading>

              <Text fontSize={{ base: '16px', md: '19px' }} color={subHeadingColor} fontWeight="500" maxW="720px" lineHeight="1.6">
                Navigate complex FCA, PRA, and Bank of England handbooks in seconds. Powered by closed-domain AI that strictly cites official statutory clauses with zero hallucinations.
              </Text>
            </VStack>

            {/* Action CTAs */}
            <HStack spacing={4} wrap="wrap" justify="center">
              {isAdmin && (
                <Button
                  size="lg"
                  bg="#52796F"
                  color="white"
                  _hover={{ bg: '#416159' }}
                  leftIcon={<LayoutDashboard size={18} />}
                  onClick={() => navigate('/admin/dashboard')}
                  px={7}
                  h="50px"
                  fontSize="md"
                  fontWeight="700"
                  boxShadow="0 4px 14px 0 rgba(82, 121, 111, 0.35)"
                >
                  Admin Control Center
                </Button>
              )}

              <Button
                size="lg"
                bg={isAdmin ? cardBg : '#52796F'}
                color={isAdmin ? headingColor : 'white'}
                border={isAdmin ? '1.5px solid' : 'none'}
                borderColor={cardBorder}
                _hover={{ bg: isAdmin ? cardBadgeBg : '#416159' }}
                leftIcon={<MessageSquare size={18} />}
                onClick={() => navigate('/chat')}
                px={7}
                h="50px"
                fontSize="md"
                fontWeight="700"
                boxShadow={isAdmin ? 'sm' : '0 4px 14px 0 rgba(82, 121, 111, 0.35)'}
              >
                {isAuthenticated ? 'Open AI Copilot' : 'Chat Now (Free Preview)'}
              </Button>

              {!isAuthenticated && (
                <Button
                  size="lg"
                  variant="outline"
                  borderColor={badgePillBorder}
                  color={headingColor}
                  _hover={{ bg: cardBadgeBg, borderColor: '#52796F' }}
                  onClick={() => navigate('/login')}
                  px={6}
                  h="50px"
                  fontSize="md"
                  fontWeight="700"
                >
                  Sign In / Register
                </Button>
              )}
            </HStack>

            {!isAuthenticated && (
              <Text fontSize="xs" color="#52796F" fontWeight="600">
                ✨ Guests can ask 2 preview questions before creating a free account.
              </Text>
            )}

            {/* Clean Interactive Chat Preview Card */}
            <Box
              mt={6}
              w="full"
              maxW="820px"
              bg={previewCardBg}
              borderRadius="3xl"
              p={{ base: 5, md: 7 }}
              border="2px solid"
              borderColor={previewCardBorder}
              boxShadow={useColorModeValue('0 20px 40px -15px rgba(82, 121, 111, 0.15)', '0 20px 40px -15px rgba(0, 0, 0, 0.5)')}
              textAlign="left"
            >
              <Flex justify="space-between" align="center" mb={4} pb={3} borderBottom="1px solid" borderColor={borderColor}>
                <HStack spacing={2}>
                  <UkFinanceLogo size="sm" showText={false} isDark={isDark} />
                  <Text fontSize="sm" fontWeight="800" color={headingColor}>
                    UK Regulatory Compliance Copilot
                  </Text>
                </HStack>
                <Badge bg={cardBadgeBg} color="#52796F" border="1px solid" borderColor={cardBadgeBorder} fontSize="10px">
                  OFFICIAL CITATIONS GROUNDED
                </Badge>
              </Flex>

              <VStack spacing={4} align="stretch">
                {/* Simulated User Question */}
                <Flex justify="flex-end">
                  <Box
                    bg="#52796F"
                    color="white"
                    px={4}
                    py={2.5}
                    borderRadius="2xl"
                    borderTopRightRadius="sm"
                    fontSize="xs"
                    fontWeight="600"
                    maxW="80%"
                  >
                    According to FCA FIT 1.1.2G, what factors determine competence and capability?
                  </Box>
                </Flex>

                {/* Simulated AI Response */}
                <Flex justify="flex-start">
                  <Box
                    bg={chatBubbleAiBg}
                    p={4}
                    borderRadius="2xl"
                    borderTopLeftRadius="sm"
                    border="1px solid"
                    borderColor={chatBubbleAiBorder}
                    fontSize="xs"
                    color={headingColor}
                    lineHeight="1.7"
                    maxW="95%"
                  >
                    <Text fontWeight="700" color="#52796F" mb={1.5}>
                      FCA Handbook Assessment under FIT 1.1.2G:
                    </Text>
                    <Text mb={2}>
                      Under <strong>FIT 1.1.2G</strong>, firms assessing whether an individual is competent and capable must consider whether the person satisfies training and competence requirements, possesses relevant technical qualifications, and has demonstrated regulatory capability.
                    </Text>
                    <HStack spacing={2} pt={1} borderTop="1px solid" borderColor={borderColor}>
                      <Badge bg={cardBg} color="#52796F" border="1px solid" borderColor={cardBadgeBorder} fontSize="9.5px">
                        📖 CITED: FIT 1.1.2G
                      </Badge>
                      <Badge bg={cardBg} color="#52796F" border="1px solid" borderColor={cardBadgeBorder} fontSize="9.5px">
                        📖 CITED: FIT 2.2
                      </Badge>
                      <Badge bg="green.50" color="green.700" fontSize="9.5px">
                        CONFIDENCE: HIGH
                      </Badge>
                    </HStack>
                  </Box>
                </Flex>
              </VStack>
            </Box>
          </VStack>
        </Container>
      </Box>

      {/* Core Sourcebooks Section */}
      <Box py={{ base: 14, md: 20 }} bg={pageBg}>
        <Container maxW="container.xl">
          <VStack spacing={12} align="stretch">
            <VStack spacing={3} textAlign="center">
              <Text fontSize="12px" fontWeight="800" color="#52796F" letterSpacing="0.05em" textTransform="uppercase">
                Regulatory Coverage
              </Text>
              <Heading fontSize={{ base: '24px', md: '36px' }} fontWeight="900" color={headingColor}>
                Official UK Financial Rulebooks
              </Heading>
              <Text fontSize="sm" color={subHeadingColor} maxW="600px">
                The AI assistant searches across authoritative sourcebooks published by the Financial Conduct Authority and Prudential Regulation Authority.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
              {sampleRules.map((rule, idx) => (
                <Card
                  key={idx}
                  bg={cardBg}
                  border="1.5px solid"
                  borderColor={cardBorder}
                  borderRadius="2xl"
                  _hover={{ borderColor: '#52796F', transform: 'translateY(-3px)', boxShadow: 'md' }}
                  transition="all 0.2s"
                >
                  <CardBody p={6}>
                    <VStack align="start" spacing={3}>
                      <Badge bg={cardBadgeBg} color="#52796F" border="1px solid" borderColor={cardBadgeBorder} fontSize="10px">
                        {rule.tag}
                      </Badge>
                      <Heading size="sm" fontWeight="800" color={headingColor}>
                        {rule.code}
                      </Heading>
                      <Text fontSize="xs" fontWeight="700" color="#52796F">
                        {rule.title}
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor} lineHeight="1.6">
                        {rule.desc}
                      </Text>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Three Core Pillars Section */}
      <Box py={{ base: 14, md: 20 }} bg={pillarsBg} borderTop="1px solid" borderBottom="1px solid" borderColor={borderColor}>
        <Container maxW="container.xl">
          <VStack spacing={12} align="stretch">
            <VStack spacing={3} textAlign="center">
              <Text fontSize="12px" fontWeight="800" color="#52796F" letterSpacing="0.05em" textTransform="uppercase">
                Trust & Authority
              </Text>
              <Heading fontSize={{ base: '24px', md: '36px' }} fontWeight="900" color={headingColor}>
                Engineered for High-Stakes Compliance
              </Heading>
              <Text fontSize="sm" color={subHeadingColor} maxW="620px">
                Unlike general-purpose chatbots, our system enforces strict closed-domain retrieval to guarantee legally grounded guidance.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
              <Box bg={pillarCardBg} p={7} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
                <Box p={3} bg={iconContainerBg} color="#52796F" borderRadius="xl" w="fit-content" mb={4}>
                  <ShieldCheck size={26} />
                </Box>
                <Heading size="sm" fontWeight="800" color={headingColor} mb={2}>
                  Zero Hallucination Guardrails
                </Heading>
                <Text fontSize="xs" color={mutedTextColor} lineHeight="1.7">
                  The AI operates strictly within uploaded regulatory texts. If a rulebook does not contain the answer, the assistant safely refuses rather than guessing.
                </Text>
              </Box>

              <Box bg={pillarCardBg} p={7} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
                <Box p={3} bg={iconContainerBg} color="#52796F" borderRadius="xl" w="fit-content" mb={4}>
                  <Scale size={26} />
                </Box>
                <Heading size="sm" fontWeight="800" color={headingColor} mb={2}>
                  Verbatim Clause Citations
                </Heading>
                <Text fontSize="xs" color={mutedTextColor} lineHeight="1.7">
                  Every response includes exact handbook code tags (e.g. FIT 1.1.2G, PRIN 2.1.1). Click any citation pill to view the verbatim statutory excerpt.
                </Text>
              </Box>

              <Box bg={pillarCardBg} p={7} borderRadius="2xl" border="1px solid" borderColor={borderColor} boxShadow="sm">
                <Box p={3} bg={iconContainerBg} color="#52796F" borderRadius="xl" w="fit-content" mb={4}>
                  <Sparkles size={26} />
                </Box>
                <Heading size="sm" fontWeight="800" color={headingColor} mb={2}>
                  Dynamic Next Inquiries
                </Heading>
                <Text fontSize="xs" color={mutedTextColor} lineHeight="1.7">
                  After every answer, the AI intelligently formulates 2–3 follow-up compliance questions that risk analysts or auditors should investigate next.
                </Text>
              </Box>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Bottom CTA Banner */}
      <Box py={{ base: 14, md: 20 }} bg={pageBg}>
        <Container maxW="container.lg">
          <Card
            bg="#52796F"
            color="white"
            borderRadius="3xl"
            p={{ base: 8, md: 12 }}
            textAlign="center"
            boxShadow="0 20px 40px -15px rgba(82, 121, 111, 0.4)"
          >
            <VStack spacing={6}>
              <Heading size="lg" fontWeight="900">
                Ready to Test Your Compliance Inquiries?
              </Heading>
              <Text fontSize="sm" color="#CAD2C5" maxW="550px" lineHeight="1.6">
                Ask questions about official FCA and PRA rules right now. Get instant, cited guidance designed for financial compliance teams.
              </Text>
              <HStack spacing={4} wrap="wrap" justify="center">
                <Button
                  size="lg"
                  bg="#FFFFFF"
                  color="#324C46"
                  _hover={{ bg: '#F4F7F5' }}
                  leftIcon={<MessageSquare size={18} />}
                  onClick={() => navigate('/chat')}
                  px={8}
                  h="50px"
                  fontWeight="800"
                  fontSize="sm"
                >
                  Start Chatting
                </Button>
                {!isAuthenticated && (
                  <Button
                    size="lg"
                    variant="outline"
                    borderColor="#CAD2C5"
                    color="white"
                    _hover={{ bg: '#416159' }}
                    onClick={() => navigate('/login')}
                    px={7}
                    h="50px"
                    fontWeight="700"
                    fontSize="sm"
                  >
                    Create Free Account
                  </Button>
                )}
              </HStack>
            </VStack>
          </Card>
        </Container>
      </Box>

      {/* Clean Minimalist Footer */}
      <Box py={8} borderTop="1px solid" borderColor={borderColor} bg={pageBg}>
        <Container maxW="container.xl">
          <Flex justify="space-between" align="center" direction={{ base: 'column', sm: 'row' }} gap={4}>
            <UkFinanceLogo size="sm" showText={true} isDark={isDark} />
            <Text fontSize="xs" color={subHeadingColor} fontWeight="500">
              © 2026 UK Financial Rules AI Compliance Assistant. Strictly for regulatory guidance.
            </Text>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
};
