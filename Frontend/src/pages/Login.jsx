import React, { useState } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  HStack,
  Card,
  CardBody,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Badge,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authApi } from '../api/auth.api.js';
import { UkFinanceLogo } from '../components/UkFinanceLogo.jsx';
import { Lock, Mail, User, Briefcase, ShieldCheck, ArrowRight, Eye, EyeOff } from 'lucide-react';

export const Login = () => {
  const [tabIndex, setTabIndex] = useState(0);

  const pageBg = useColorModeValue('linear-gradient(180deg, #F4F7F5 0%, #FFFFFF 100%)', 'linear-gradient(180deg, #0B1110 0%, #141E1C 100%)');
  const cardBg = useColorModeValue('white', '#141E1C');
  const cardBorder = useColorModeValue('#CAD7D0', '#263B36');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const badgeBg = useColorModeValue('#F4F7F5', '#1A2926');
  const badgeBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const tabListBg = useColorModeValue('#F4F7F5', '#182724');
  const tabListBorder = useColorModeValue('#E5ECE8', '#263B36');
  const inputContainerBg = useColorModeValue('white', '#182724');
  const inputBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const inputTextColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const dividerBorder = useColorModeValue('#E5ECE8', '#263B36');
  const isDark = useColorModeValue(false, true);

  // Sign In States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign Up States
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupDepartment, setSignupDepartment] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Handle Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast({
        title: 'Please provide both email and password',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsLoggingIn(true);
    try {
      const res = await authApi.login(loginEmail, loginPassword);
      const { user, token } = res.data;
      login(token, user);

      toast({
        title: `Welcome back, ${user.name}!`,
        status: 'success',
        duration: 2500,
      });

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      toast({
        title: 'Sign in failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Sign Up
  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      toast({
        title: 'Please fill in all required fields',
        status: 'warning',
        duration: 3000,
      });
      return;
    }

    setIsSigningUp(true);
    try {
      const res = await authApi.signup({
        name: signupName,
        email: signupEmail,
        password: signupPassword,
        department: signupDepartment || 'Risk & Compliance',
      });

      const { user, token } = res.data;
      login(token, user);

      toast({
        title: `Account created successfully!`,
        description: `Welcome, ${user.name}`,
        status: 'success',
        duration: 3000,
      });

      if (user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/chat');
      }
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg={pageBg}
      px={4}
      py={10}
      position="relative"
    >
      <Card
        maxW="460px"
        w="full"
        borderRadius="2xl"
        boxShadow={useColorModeValue("0 15px 35px -10px rgba(82, 121, 111, 0.15)", "0 15px 35px -10px rgba(0, 0, 0, 0.5)")}
        border="1px solid"
        borderColor={cardBorder}
        bg={cardBg}
        p={2}
      >
        <CardBody p={{ base: 6, md: 8 }}>
          <VStack spacing={6} align="stretch">
            {/* Header with Precision Logo */}
            <VStack spacing={3} textAlign="center" align="center">
              <UkFinanceLogo size="lg" showText={false} isDark={isDark} />
              <VStack spacing={1}>
                <Heading size="md" fontWeight="900" color={headingColor} letterSpacing="-0.02em">
                  UK Financial Rules AI
                </Heading>
                <Text fontSize="xs" color="#52796F" fontWeight="700" letterSpacing="0.04em" textTransform="uppercase">
                  Official Compliance Intelligence Copilot
                </Text>
              </VStack>
              <HStack spacing={2}>
                <Badge bg={badgeBg} color="#52796F" border="1px solid" borderColor={badgeBorder} fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="700">
                  FCA & PRA Standards
                </Badge>
                <Badge bg={badgeBg} color="#52796F" border="1px solid" borderColor={badgeBorder} fontSize="10px" px={2} py={0.5} borderRadius="md" fontWeight="700">
                  Handbook Search
                </Badge>
              </HStack>
            </VStack>

            <Divider borderColor={dividerBorder} />

            {/* Clean Tabs for Sign In / Sign Up */}
            <Tabs isFitted variant="soft-rounded" index={tabIndex} onChange={(index) => setTabIndex(index)}>
              <TabList mb={5} bg={tabListBg} p={1} borderRadius="xl" border="1px solid" borderColor={tabListBorder}>
                <Tab
                  fontWeight="700"
                  fontSize="xs"
                  borderRadius="lg"
                  color="#52796F"
                  _selected={{ bg: '#52796F', color: 'white', boxShadow: 'sm' }}
                >
                  Sign In
                </Tab>
                <Tab
                  fontWeight="700"
                  fontSize="xs"
                  borderRadius="lg"
                  color="#52796F"
                  _selected={{ bg: '#52796F', color: 'white', boxShadow: 'sm' }}
                >
                  Create Account
                </Tab>
              </TabList>

              <TabPanels>
                {/* Sign In Panel */}
                <TabPanel p={0}>
                  <form onSubmit={handleLoginSubmit} autoComplete="off">
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Work Email</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <Mail size={16} color="#52796F" />
                          <Input
                            type="email"
                            placeholder="compliance@firm.co.uk"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            autoComplete="off"
                            variant="unstyled"
                            py={2.5}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                        </HStack>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Password</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <Lock size={16} color="#52796F" />
                          <Input
                            type={showLoginPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            autoComplete="new-password"
                            variant="unstyled"
                            py={2.5}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                          <IconButton
                            variant="ghost"
                            size="xs"
                            aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                            icon={showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            color="#52796F"
                            _hover={{ bg: 'transparent', opacity: 0.75 }}
                            onClick={() => setShowLoginPassword((prev) => !prev)}
                            tabIndex={-1}
                          />
                        </HStack>
                      </FormControl>

                      <Button
                        type="submit"
                        bg="#52796F"
                        color="white"
                        _hover={{ bg: '#416159' }}
                        w="full"
                        size="md"
                        mt={2}
                        h="44px"
                        borderRadius="xl"
                        isLoading={isLoggingIn}
                        loadingText="Authenticating..."
                        fontWeight="700"
                        fontSize="sm"
                        rightIcon={<ArrowRight size={15} />}
                        boxShadow="0 4px 12px -2px rgba(82, 121, 111, 0.35)"
                      >
                        Sign In to Copilot
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>

                {/* Sign Up Panel */}
                <TabPanel p={0}>
                  <form onSubmit={handleSignupSubmit} autoComplete="off">
                    <VStack spacing={3.5}>
                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Full Name</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <User size={16} color="#52796F" />
                          <Input
                            placeholder="Compliance Analyst"
                            value={signupName}
                            onChange={(e) => setSignupName(e.target.value)}
                            autoComplete="off"
                            variant="unstyled"
                            py={2}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                        </HStack>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Work Email</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <Mail size={16} color="#52796F" />
                          <Input
                            type="email"
                            placeholder="analyst@firm.co.uk"
                            value={signupEmail}
                            onChange={(e) => setSignupEmail(e.target.value)}
                            autoComplete="off"
                            variant="unstyled"
                            py={2}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                        </HStack>
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Password</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <Lock size={16} color="#52796F" />
                          <Input
                            type={showSignupPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            value={signupPassword}
                            onChange={(e) => setSignupPassword(e.target.value)}
                            autoComplete="new-password"
                            variant="unstyled"
                            py={2}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                          <IconButton
                            variant="ghost"
                            size="xs"
                            aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                            icon={showSignupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            color="#52796F"
                            _hover={{ bg: 'transparent', opacity: 0.75 }}
                            onClick={() => setShowSignupPassword((prev) => !prev)}
                            tabIndex={-1}
                          />
                        </HStack>
                      </FormControl>

                      <FormControl>
                        <FormLabel fontSize="xs" fontWeight="700" color={headingColor}>Department / Division</FormLabel>
                        <HStack
                          bg={inputContainerBg}
                          border="1.5px solid"
                          borderColor={inputBorder}
                          borderRadius="xl"
                          px={3.5}
                          _focusWithin={{ borderColor: '#52796F', boxShadow: '0 0 0 3px rgba(82, 121, 111, 0.15)' }}
                          transition="all 0.2s"
                        >
                          <Briefcase size={16} color="#52796F" />
                          <Input
                            placeholder="e.g. Risk & Compliance, Conduct Legal"
                            value={signupDepartment}
                            onChange={(e) => setSignupDepartment(e.target.value)}
                            autoComplete="off"
                            variant="unstyled"
                            py={2}
                            fontSize="sm"
                            fontWeight="500"
                            color={inputTextColor}
                          />
                        </HStack>
                      </FormControl>

                      <Button
                        type="submit"
                        bg="#52796F"
                        color="white"
                        _hover={{ bg: '#416159' }}
                        w="full"
                        size="md"
                        mt={2}
                        h="44px"
                        borderRadius="xl"
                        isLoading={isSigningUp}
                        loadingText="Creating Account..."
                        fontWeight="700"
                        fontSize="sm"
                        boxShadow="0 4px 12px -2px rgba(82, 121, 111, 0.35)"
                      >
                        Create Authorized Account
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </CardBody>
      </Card>
    </Flex>
  );
};
