import React from 'react';
import {
  Box,
  Flex,
  HStack,
  Text,
  Button,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Container,
  IconButton,
  Tooltip,
  useColorMode,
  useColorModeValue,
} from '@chakra-ui/react';
import { NavLink as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { NotificationBell } from './NotificationBell.jsx';
import { UkFinanceLogo } from './UkFinanceLogo.jsx';
import {
  Upload,
  BookOpen,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  Home as HomeIcon,
  LogIn,
  Users,
  Coins,
  Sun,
  Moon,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAdmin, isEmployee, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  if (location.pathname.startsWith('/widget') || location.pathname.startsWith('/test')) {
    return null;
  }

  const navBg = useColorModeValue('rgba(255, 255, 255, 0.98)', 'rgba(15, 23, 21, 0.96)');
  const navBorder = useColorModeValue('#E5ECE8', '#263B36');
  const navShadow = useColorModeValue('0 1px 3px 0 rgba(82, 121, 111, 0.05)', '0 1px 12px 0 rgba(0, 0, 0, 0.35)');
  const badgeBg = useColorModeValue('#F4F7F5', '#1A2926');
  const badgeBorder = useColorModeValue('#CAD7D0', '#344E48');
  const nameColor = useColorModeValue('#2F3E46', '#E2E8F0');
  const deptColor = useColorModeValue('#52796F', '#84A98C');
  const toggleBg = useColorModeValue('#FFFFFF', '#141E1C');
  const toggleBorder = useColorModeValue('#E5ECE8', '#263B36');
  const toggleHoverBg = useColorModeValue('#F4F7F5', '#1C2B27');
  const centerBarBg = useColorModeValue('#F4F7F5', '#121C1A');
  const centerBarBorder = useColorModeValue('#E5ECE8', '#263B36');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkStyles = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '5px 11px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: isActive ? '700' : '600',
    whiteSpace: 'nowrap',
    color: isActive ? (isDark ? '#84A98C' : '#52796F') : (isDark ? '#CAD7D0' : '#475569'),
    backgroundColor: isActive ? (isDark ? '#1C2B27' : '#FFFFFF') : 'transparent',
    border: isActive ? `1px solid ${isDark ? '#344E48' : '#CAD7D0'}` : '1px solid transparent',
    boxShadow: isActive ? (isDark ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)') : 'none',
    transition: 'all 0.15s ease-in-out',
  });

  return (
    <Box
      bg={navBg}
      backdropFilter="blur(10px)"
      borderBottomWidth="1px"
      borderColor={navBorder}
      position="sticky"
      top="0"
      zIndex="1000"
      boxShadow={navShadow}
      transition="background-color 0.2s ease, border-color 0.2s ease"
    >
      <Container maxW="container.2xl" px={{ base: 3, md: 6 }}>
        <Flex h={16} alignItems="center" justify="space-between">
          {/* Left Side: Brand Logo & Role Badge */}
          <Flex align="center" flex="1" justify="flex-start" minW="max-content">
            <HStack spacing={2.5} onClick={() => navigate('/')} cursor="pointer" flexShrink={0}>
              <UkFinanceLogo size="sm" showText={true} isDark={isDark} />
            </HStack>
          </Flex>

          {/* Center: Compact Navigation Options Capsule */}
          <Flex justify="center" align="center" flex="0 0 auto" mx={{ base: 2, md: 4 }}>
            <HStack
              spacing="3px"
              p="3px"
              bg={centerBarBg}
              borderRadius="xl"
              border="1px solid"
              borderColor={centerBarBorder}
              boxShadow={isDark ? 'none' : '0 1px 2px 0 rgba(0, 0, 0, 0.03)'}
            >
              {/* Common Home Link */}
              <RouterLink to="/" style={navLinkStyles}>
                <HomeIcon size={14} />
                <span>Home</span>
              </RouterLink>

              {/* Admin Links (Chat & Test removed) */}
              {isAdmin && (
                <>
                  <RouterLink to="/admin/dashboard" style={navLinkStyles}>
                    <LayoutDashboard size={14} />
                    <span>Dashboard</span>
                  </RouterLink>
                  <RouterLink to="/admin/upload" style={navLinkStyles}>
                    <Upload size={14} />
                    <span>Upload Rule</span>
                  </RouterLink>
                  <RouterLink to="/admin/rules" style={navLinkStyles}>
                    <BookOpen size={14} />
                    <span>Rules Library</span>
                  </RouterLink>
                  <RouterLink to="/admin/users" style={navLinkStyles}>
                    <Users size={14} />
                    <span>Team & Access</span>
                  </RouterLink>
                  <RouterLink to="/admin/cost-analysis" style={navLinkStyles}>
                    <Coins size={14} />
                    <span>Token Analysis</span>
                  </RouterLink>
                </>
              )}

              {/* Employee Links */}
              {isEmployee && (
                <RouterLink to="/chat" style={navLinkStyles}>
                  <MessageSquare size={14} />
                  <span>Compliance Copilot</span>
                </RouterLink>
              )}

              {/* Unauthenticated Guest Links */}
              {!isAuthenticated && (
                <RouterLink to="/chat" style={navLinkStyles}>
                  <MessageSquare size={14} />
                  <span>Chat Preview</span>
                </RouterLink>
              )}
            </HStack>
          </Flex>

          {/* Right Side: Theme Switcher & Authentication / Super Admin Profile */}
          <Flex align="center" flex="1" justify="flex-end" minW="max-content">
            <HStack spacing={2.5} flexShrink={0}>
              {/* Light / Dark Mode Toggle Button */}
              <Tooltip
                label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                hasArrow
                borderRadius="lg"
                fontSize="xs"
                bg={isDark ? '#263B36' : '#2F3E46'}
              >
                <IconButton
                  aria-label="Toggle theme color mode"
                  icon={
                    isDark ? (
                      <Sun size={16} color="#FBBF24" />
                    ) : (
                      <Moon size={16} color="#354F52" />
                    )
                  }
                  onClick={toggleColorMode}
                  variant="ghost"
                  size="sm"
                  borderRadius="xl"
                  border="1px solid"
                  borderColor={toggleBorder}
                  bg={toggleBg}
                  _hover={{
                    bg: toggleHoverBg,
                    borderColor: '#52796F',
                    transform: 'rotate(12deg)',
                  }}
                  transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
                />
              </Tooltip>

              {isAuthenticated ? (
                <>
                  <NotificationBell />

                  <Menu>
                  <MenuButton as={Button} variant="ghost" p={1} borderRadius="full" _hover={{ bg: toggleHoverBg }}>
                    <HStack spacing={2}>
                      <Avatar
                        size="sm"
                        name={user?.name || 'User'}
                        bg="#52796F"
                        color="white"
                        fontWeight="700"
                        fontSize="xs"
                      />
                      <Box textAlign="left" display={{ base: 'none', md: 'block' }}>
                        <Text fontSize="xs" fontWeight="700" color={nameColor} lineHeight="1.2">
                          {user?.name}
                        </Text>
                        <Text fontSize="10px" color={deptColor} fontWeight="600">
                          {user?.department || (isAdmin ? 'Administrator' : 'Compliance')}
                        </Text>
                      </Box>
                    </HStack>
                  </MenuButton>
                  <MenuList borderRadius="xl" boxShadow="xl" py={2} borderColor={navBorder}>
                    <Box px={3} py={1.5}>
                      <Text fontSize="10px" color="#84A98C" fontWeight="700" textTransform="uppercase">
                        Signed in as
                      </Text>
                      <Text fontSize="sm" fontWeight="700" color={nameColor}>{user?.name}</Text>
                      <Text fontSize="xs" color="#52796F">{user?.email}</Text>
                    </Box>
                    <MenuDivider borderColor={navBorder} />
                    {isAdmin && (
                      <>
                        <MenuItem
                          icon={<LayoutDashboard size={15} />}
                          onClick={() => navigate('/admin/dashboard')}
                          fontSize="sm"
                          fontWeight="600"
                        >
                          Admin Dashboard
                        </MenuItem>
                        <MenuDivider borderColor={navBorder} />
                      </>
                    )}
                    <MenuItem
                      icon={<LogOut size={15} />}
                      onClick={handleLogout}
                      color="red.600"
                      fontSize="sm"
                      fontWeight="600"
                      _hover={{ bg: isDark ? '#2D1515' : 'red.50' }}
                    >
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <HStack spacing={2}>
                <Button
                  size="sm"
                  bg="#52796F"
                  color="white"
                  _hover={{ bg: '#416159' }}
                  leftIcon={<LogIn size={15} />}
                  onClick={() => navigate('/login')}
                  fontSize="xs"
                  fontWeight="700"
                  borderRadius="xl"
                  px={4}
                >
                  Sign In / Register
                </Button>
              </HStack>
            )}
          </HStack>
        </Flex>
      </Flex>
    </Container>
  </Box>
);
};
