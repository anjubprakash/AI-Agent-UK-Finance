import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Badge,
  Card,
  Flex,
  Spinner,
  Tag,
  TagLabel,
  TagLeftIcon,
  useToast,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  IconButton,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw,
  MessageSquare,
  Plus,
  Trash2,
  Edit2,
  Search,
  PanelLeftClose,
  PanelLeft,
  Lock,
  UserPlus,
  LogIn,
  Check,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentApi } from '../../api/agent.api.js';
import { CitationDrawer } from '../../components/CitationDrawer.jsx';
import { UkFinanceLogo } from '../../components/UkFinanceLogo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const DEFAULT_WELCOME_MESSAGE = {
  role: 'assistant',
  content: `### Welcome to the UK Financial Rules AI Assistant\n\nI am your compliance intelligence assistant for official UK financial regulations published by the **Financial Conduct Authority (FCA)**, **Prudential Regulation Authority (PRA)**, and **Bank of England**.\n\nEvery response is strictly grounded in official sourcebooks with verbatim citations and full multi-turn conversational memory.\n\nType your compliance question below to begin:`,
  confidence: 'HIGH',
  citedRules: [],
  suggestedFollowUps: [],
};

export const ChatAssistant = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  // Conversations and active thread state
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeTitle, setActiveTitle] = useState('New Compliance Inquiry');
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);

  // Chat message feed for active thread
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Sidebar & Search UI
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth > 860);
  const [chatSearch, setChatSearch] = useState('');
  const [editingChatId, setEditingChatId] = useState(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Modals & drawers
  const [activeCitation, setActiveCitation] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // Guest inquiry counter (stored in localStorage)
  const [guestCount, setGuestCount] = useState(() => {
    const saved = localStorage.getItem('uk_finance_guest_count');
    return saved ? parseInt(saved, 10) : 0;
  });

  const chatBottomRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Load user's conversations list on mount or when authenticated
  const loadConversations = async () => {
    if (!isAuthenticated) return;
    setIsConversationsLoading(true);
    try {
      const res = await agentApi.listConversations();
      const list = res.data || [];
      setConversations(list);
    } catch (err) {
      console.warn('Could not load conversations:', err.message);
    } finally {
      setIsConversationsLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [isAuthenticated]);

  // Handle selecting a past conversation
  const handleSelectConversation = async (convId) => {
    if (convId === activeConversationId) return;
    setIsSending(true);
    try {
      const res = await agentApi.getConversation(convId);
      const conv = res.data;
      setActiveConversationId(conv.id || conv._id);
      setActiveTitle(conv.title || 'Compliance Inquiry');

      if (conv.messages && conv.messages.length > 0) {
        setMessages(
          conv.messages.map((m) => ({
            role: m.role,
            content: m.content,
            confidence: m.confidence || 'HIGH',
            citedRules: m.citedRules || [],
            suggestedFollowUps: m.suggestedFollowUps || [],
            timestamp: m.createdAt
              ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '',
          }))
        );
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch (err) {
      toast({
        title: 'Error opening chat',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  // Start a fresh new chat session
  const handleNewChat = () => {
    setActiveConversationId(null);
    setActiveTitle('New Compliance Inquiry');
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput('');
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Delete a conversation thread
  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation history?')) return;

    try {
      await agentApi.deleteConversation(convId);
      setConversations((prev) => prev.filter((c) => c.id !== convId && c._id !== convId));
      if (activeConversationId === convId) {
        handleNewChat();
      }
      toast({
        title: 'Conversation deleted',
        status: 'info',
        duration: 2500,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: err.message,
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Start editing title
  const handleStartEditTitle = (e, conv) => {
    e.stopPropagation();
    setEditingChatId(conv.id || conv._id);
    setEditTitleValue(conv.title || '');
  };

  // Save renamed title
  const handleSaveTitle = async (convId) => {
    if (!editTitleValue.trim()) {
      setEditingChatId(null);
      return;
    }
    try {
      await agentApi.updateConversation(convId, { title: editTitleValue.trim() });
      setConversations((prev) =>
        prev.map((c) =>
          c.id === convId || c._id === convId ? { ...c, title: editTitleValue.trim() } : c
        )
      );
      if (activeConversationId === convId) {
        setActiveTitle(editTitleValue.trim());
      }
      toast({ title: 'Title updated', status: 'success', duration: 2000, isClosable: true });
    } catch (err) {
      toast({ title: 'Rename failed', description: err.message, status: 'error', duration: 3000, isClosable: true });
    } finally {
      setEditingChatId(null);
    }
  };

  // Filter conversations in sidebar
  const filteredConversations = useMemo(() => {
    if (!chatSearch.trim()) return conversations;
    const query = chatSearch.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title?.toLowerCase().includes(query) ||
        c.lastMessageSnippet?.toLowerCase().includes(query)
    );
  }, [conversations, chatSearch]);

  // Send message
  const handleSend = async (questionToSend) => {
    const query = questionToSend || input;
    if (!query || typeof query !== 'string' || !query.trim()) return;

    // Guest inquiry limit check
    if (!isAuthenticated) {
      if (guestCount >= 2) {
        setLimitModalOpen(true);
        return;
      }
    }

    const userMessage = {
      role: 'user',
      content: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsSending(true);

    // Build memory history from existing turns (excluding welcome prompt)
    const historyTurns = messages
      .filter((m) => m !== DEFAULT_WELCOME_MESSAGE && m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const res = await agentApi.queryAgent(query.trim(), activeConversationId, historyTurns);
      const {
        answer,
        citedRules,
        suggestedFollowUps,
        confidence,
        conversationId,
        conversationTitle,
      } = res.data;

      // If a new conversation was created on the backend, update active state and sidebar
      if (conversationId && !activeConversationId) {
        setActiveConversationId(conversationId);
        if (conversationTitle) setActiveTitle(conversationTitle);
        // Refresh sidebar
        loadConversations();
      }

      const assistantMessage = {
        role: 'assistant',
        content: answer,
        confidence: confidence || 'HIGH',
        citedRules: citedRules || [],
        suggestedFollowUps: suggestedFollowUps || [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // If guest, increment guest counter
      if (!isAuthenticated) {
        const nextCount = guestCount + 1;
        setGuestCount(nextCount);
        localStorage.setItem('uk_finance_guest_count', nextCount.toString());
      }
    } catch (err) {
      const isDbDown =
        err.message?.toLowerCase().includes('qdrant') ||
        err.message?.toLowerCase().includes('vector database') ||
        err.message?.toLowerCase().includes('econnrefused') ||
        err.message?.toLowerCase().includes('503');

      toast({
        title: isDbDown ? 'Compliance Knowledge Base Offline' : 'Inquiry Notice',
        description: isDbDown
          ? 'The regulatory knowledge base service is temporarily unavailable. Please try again shortly.'
          : err.message,
        status: isDbDown ? 'error' : 'warning',
        duration: 5000,
        isClosable: true,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: isDbDown
            ? `### ⚠️ Compliance Knowledge Base Unavailable\n\nThe AI compliance assistant cannot search regulatory rules because the knowledge base service is temporarily offline.\n\n**To resolve:** Please wait a moment and try asking your question again.`
            : `### ⚠️ Inquiry Error\n\n${err.message || 'An unexpected error occurred while querying the UK compliance rules knowledge base.'}`,
          confidence: isDbDown ? 'DB_OFFLINE' : 'ERROR',
          citedRules: [],
          suggestedFollowUps: isDbDown
            ? ['Which UK regulatory sourcebooks are supported?', 'What are the 12 Principles for Businesses under FCA PRIN?']
            : ['Which UK regulatory sourcebooks are currently indexed?'],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  // Dynamic color mode tokens
  const pageBg = useColorModeValue('#F7FAF8', '#0B1110');
  const cardBg = useColorModeValue('#FFFFFF', '#141E1C');
  const cardBorder = useColorModeValue('#E5ECE8', '#263B36');
  const sidebarBg = useColorModeValue('#F9FBFA', '#0F1715');
  const sidebarBorder = useColorModeValue('#E5ECE8', '#263B36');
  const searchBg = useColorModeValue('white', '#182724');
  const searchBorder = useColorModeValue('#D6E0DA', '#2B3F3B');
  const assistantCardBg = useColorModeValue('#FFFFFF', '#182724');
  const assistantCardBorder = useColorModeValue('#E0EBE4', '#263B36');
  const assistantCardShadow = useColorModeValue('0 2px 10px rgba(0, 0, 0, 0.04)', '0 4px 14px rgba(0, 0, 0, 0.35)');
  const citedTagBg = useColorModeValue('#FFFFFF', '#141E1C');
  const citedTagBorder = useColorModeValue('#CAD7D0', '#344E48');
  const bottomBarBg = useColorModeValue('#FAFCFB', '#0F1715');
  const inputBg = useColorModeValue('white', '#182724');
  const inputBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const guestBoxBg = useColorModeValue('#F0F4F2', '#1A2926');
  const guestBoxBorder = useColorModeValue('#DDE6E1', '#2D443E');
  const threadActiveBg = useColorModeValue('#EBF2EE', '#223530');
  const threadActiveBorder = useColorModeValue('#CAD7D0', '#3D5A52');
  const threadHoverBg = useColorModeValue('#F2F6F4', '#1C2B27');
  const threadTextColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const threadInactiveColor = useColorModeValue('#52796F', '#CAD7D0');
  const scrollbarThumb = useColorModeValue('#D6E0DA', '#2B3F3B');
  const inputTextColor = useColorModeValue('#182724', '#F1F5F9');

  const openCitation = (citation) => {
    setActiveCitation(citation);
    setDrawerOpen(true);
  };

  const formatCitationTag = (cite) => {
    const raw = (cite.ruleCode || cite.ruleTitle || '').trim();
    if (!raw) return 'Rule Excerpt';
    const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length <= 2) {
      return parts.join(', ');
    }
    return `${parts[0]}, ${parts[1]} (+${parts.length - 2})`;
  };

  return (
    <Box minH="calc(100vh - 64px)" bg={pageBg} py={{ base: 2, md: 4 }}>
      <Container maxW="container.2xl" px={{ base: 2, md: 4 }}>
        <Card
          minH="calc(100vh - 96px)"
          h="calc(100vh - 96px)"
          borderRadius="2xl"
          display="flex"
          flexDirection="row"
          boxShadow="0 4px 24px -2px rgba(82, 121, 111, 0.12)"
          border="1px solid"
          borderColor={cardBorder}
          overflow="hidden"
          bg={cardBg}
        >
          {/* ========================================================= */}
          {/* LEFT SIDEBAR: ChatGPT-Style Past Conversations            */}
          {/* ========================================================= */}
          <Box
            w={sidebarOpen ? { base: '100%', md: '290px', lg: '320px' } : '0px'}
            minW={sidebarOpen ? { base: '100%', md: '290px', lg: '320px' } : '0px'}
            maxW={sidebarOpen ? { base: '100%', md: '290px', lg: '320px' } : '0px'}
            borderRightWidth={sidebarOpen ? '1px' : '0px'}
            borderColor={sidebarBorder}
            bg={sidebarBg}
            display={{ base: sidebarOpen ? 'flex' : 'none', md: sidebarOpen ? 'flex' : 'none' }}
            flexDirection="column"
            transition="all 0.25s ease-in-out"
            overflow="hidden"
            zIndex={10}
          >
            {/* Sidebar Top: New Chat Action & Collapse Toggle */}
            <Box p={3.5} borderBottomWidth="1px" borderColor={sidebarBorder}>
              <HStack spacing={2} align="center">
                <Button
                  flex="1"
                  leftIcon={<Plus size={16} />}
                  colorScheme="brand"
                  bg="#52796F"
                  color="white"
                  _hover={{ bg: '#3D5A52', transform: 'translateY(-1px)' }}
                  _active={{ bg: '#2F3E46' }}
                  borderRadius="xl"
                  h="42px"
                  fontWeight="700"
                  fontSize="sm"
                  onClick={handleNewChat}
                  boxShadow="0 2px 8px rgba(82, 121, 111, 0.25)"
                >
                  New Chat
                </Button>

                <Tooltip label="Close sidebar" hasArrow placement="bottom">
                  <IconButton
                    icon={<PanelLeftClose size={18} />}
                    h="42px"
                    w="42px"
                    variant="ghost"
                    color={threadInactiveColor}
                    _hover={{ bg: threadHoverBg, color: '#52796F' }}
                    borderRadius="xl"
                    aria-label="Close sidebar"
                    onClick={() => setSidebarOpen(false)}
                  />
                </Tooltip>
              </HStack>

              {/* Chat search */}
              {conversations.length > 0 && (
                <HStack mt={3} bg={searchBg} border="1px solid" borderColor={searchBorder} borderRadius="lg" px={2.5} py={1}>
                  <Search size={14} color="#52796F" />
                  <Input
                    placeholder="Search past inquiries..."
                    size="xs"
                    variant="unstyled"
                    value={chatSearch}
                    onChange={(e) => setChatSearch(e.target.value)}
                    color={inputTextColor}
                  />
                  {chatSearch && (
                    <IconButton
                      icon={<X size={12} />}
                      size="2xs"
                      variant="ghost"
                      aria-label="Clear search"
                      onClick={() => setChatSearch('')}
                    />
                  )}
                </HStack>
              )}
            </Box>

            {/* Sidebar Middle: Conversation Thread List */}
            <Box flex="1" overflowY="auto" p={2.5}>
              {!isAuthenticated ? (
                <Box p={3.5} bg={guestBoxBg} borderRadius="xl" border="1px solid" borderColor={guestBoxBorder} mt={2}>
                  <HStack spacing={2} color="#52796F" mb={1.5}>
                    <Lock size={15} />
                    <Text fontSize="xs" fontWeight="700">Guest Mode</Text>
                  </HStack>
                  <Text fontSize="2xs" color="#52796F" lineHeight="1.4">
                    Sign in to save multiple conversation threads, search past questions, and enjoy unlimited AI compliance queries.
                  </Text>
                  <Button
                    size="xs"
                    mt={2.5}
                    w="full"
                    variant="solid"
                    colorScheme="brand"
                    bg="#52796F"
                    onClick={() => navigate('/login')}
                  >
                    Sign In to Save History
                  </Button>
                </Box>
              ) : isConversationsLoading ? (
                <Flex justify="center" align="center" py={8}>
                  <Spinner size="sm" color="#52796F" />
                </Flex>
              ) : filteredConversations.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={12} px={3} textAlign="center">
                  <MessageSquare size={28} color="#CAD7D0" />
                  <Text fontSize="xs" color="#84A98C" fontWeight="600" mt={2}>
                    {chatSearch ? 'No matching conversations' : 'No past inquiries yet'}
                  </Text>
                  <Text fontSize="2xs" color="gray.400" mt={0.5}>
                    {chatSearch ? 'Try another keyword' : 'Ask your first question to save a thread.'}
                  </Text>
                </Flex>
              ) : (
                <VStack spacing={1} align="stretch">
                  <Text fontSize="2xs" fontWeight="800" color="#84A98C" textTransform="uppercase" letterSpacing="0.05em" px={2} py={1}>
                    Recent Conversations ({filteredConversations.length})
                  </Text>

                  {filteredConversations.map((conv) => {
                    const convId = conv.id || conv._id;
                    const isActive = activeConversationId === convId;

                    return (
                      <Box
                        key={convId}
                        p={2.5}
                        borderRadius="xl"
                        cursor="pointer"
                        bg={isActive ? threadActiveBg : 'transparent'}
                        border="1px solid"
                        borderColor={isActive ? threadActiveBorder : 'transparent'}
                        _hover={{ bg: isActive ? threadActiveBg : threadHoverBg }}
                        transition="all 0.15s"
                        onClick={() => handleSelectConversation(convId)}
                        position="relative"
                        role="group"
                      >
                        {editingChatId === convId ? (
                          <HStack spacing={1} onClick={(e) => e.stopPropagation()}>
                            <Input
                              size="xs"
                              value={editTitleValue}
                              onChange={(e) => setEditTitleValue(e.target.value)}
                              autoFocus
                              color={inputTextColor}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveTitle(convId);
                                if (e.key === 'Escape') setEditingChatId(null);
                              }}
                            />
                            <IconButton
                              icon={<Check size={12} />}
                              size="xs"
                              colorScheme="green"
                              aria-label="Save"
                              onClick={() => handleSaveTitle(convId)}
                            />
                            <IconButton
                              icon={<X size={12} />}
                              size="xs"
                              variant="ghost"
                              aria-label="Cancel"
                              onClick={() => setEditingChatId(null)}
                            />
                          </HStack>
                        ) : (
                          <HStack justify="space-between" align="center">
                            <HStack spacing={2} overflow="hidden" flex="1">
                              <MessageSquare size={14} color={isActive ? '#52796F' : '#84A98C'} style={{ flexShrink: 0 }} />
                              <Text
                                fontSize="xs"
                                fontWeight={isActive ? '700' : '500'}
                                color={isActive ? threadTextColor : threadInactiveColor}
                                noOfLines={1}
                              >
                                {conv.title || 'Compliance Inquiry'}
                              </Text>
                            </HStack>

                            {/* Hover Actions: Rename & Delete */}
                            <HStack
                              spacing={1}
                              display={{ base: 'flex', md: 'none' }}
                              _groupHover={{ display: 'flex' }}
                              flexShrink={0}
                            >
                              <IconButton
                                icon={<Edit2 size={12} />}
                                size="2xs"
                                variant="ghost"
                                colorScheme="gray"
                                aria-label="Rename"
                                onClick={(e) => handleStartEditTitle(e, conv)}
                              />
                              <IconButton
                                icon={<Trash2 size={12} />}
                                size="2xs"
                                variant="ghost"
                                colorScheme="red"
                                aria-label="Delete"
                                onClick={(e) => handleDeleteConversation(e, convId)}
                              />
                            </HStack>
                          </HStack>
                        )}
                      </Box>
                    );
                  })}
                </VStack>
              )}
            </Box>
          </Box>

          {/* ========================================================= */}
          {/* MAIN CHAT WINDOW                                          */}
          {/* ========================================================= */}
          <Flex direction="column" flex="1" h="full" overflow="hidden" bg={cardBg}>
            {/* Main Header Bar */}
            <Box
              px={{ base: 3, md: 5 }}
              py={3}
              borderBottomWidth="1px"
              borderColor={sidebarBorder}
              bg="#52796F"
              color="white"
            >
              <Flex justify="space-between" align="center" wrap="wrap" gap={2}>
                <HStack spacing={2}>
                  {/* When sidebar is closed: show Open Sidebar button */}
                  {!sidebarOpen && (
                    <Tooltip label="Open sidebar" hasArrow>
                      <IconButton
                        icon={<PanelLeft size={18} />}
                        size="sm"
                        variant="ghost"
                        color="white"
                        _hover={{ bg: 'whiteAlpha.300' }}
                        borderRadius="lg"
                        aria-label="Open sidebar"
                        onClick={() => setSidebarOpen(true)}
                      />
                    </Tooltip>
                  )}

                  <Box>
                    <Text fontSize="sm" fontWeight="800" letterSpacing="-0.01em" noOfLines={1}>
                      {activeTitle}
                    </Text>
                  </Box>
                </HStack>

                <HStack spacing={2}>
                  {!isAuthenticated && (
                    <Badge bg="white" color="#52796F" fontSize="11px" px={2.5} py={1} borderRadius="full">
                      Preview: {2 - guestCount > 0 ? `${2 - guestCount} queries remaining` : 'Limit reached'}
                    </Badge>
                  )}
                </HStack>
              </Flex>
            </Box>

            {/* Chat Message Scrollable View */}
            <Box
              flex="1"
              overflowY="auto"
              px={{ base: 3, md: 6 }}
              py={4}
              css={{
                '&::-webkit-scrollbar': { width: '6px' },
                '&::-webkit-scrollbar-thumb': { background: '#D6E0DA', borderRadius: '4px' },
              }}
            >
              <VStack spacing={4} align="stretch">
                {messages.map((msg, index) => (
                  <Box key={index}>
                    {/* User Message Bubble */}
                    {msg.role === 'user' ? (
                      <Flex justify="flex-end" mb={1}>
                        <Box
                          maxW={{ base: '85%', md: '75%' }}
                          bg="#52796F"
                          color="white"
                          px={4}
                          py={2.5}
                          borderRadius="2xl"
                          borderBottomRightRadius="sm"
                          boxShadow="0 2px 8px rgba(82, 121, 111, 0.18)"
                        >
                          <Text fontSize="sm" fontWeight="500" whiteSpace="pre-wrap">
                            {msg.content}
                          </Text>
                          {msg.timestamp && (
                            <Text fontSize="2xs" color="whiteAlpha.700" textAlign="right" mt={1}>
                              {msg.timestamp}
                            </Text>
                          )}
                        </Box>
                      </Flex>
                    ) : (
                      /* Assistant Regulatory Card */
                      <Flex justify="flex-start" mb={2}>
                        <HStack align="flex-start" spacing={3} maxW={{ base: '100%', md: '88%' }}>
                          <Box
                            w={8}
                            h={8}
                            borderRadius="lg"
                            bg="#52796F"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexShrink={0}
                            boxShadow="0 2px 6px rgba(82, 121, 111, 0.2)"
                          >
                            <UkFinanceLogo size="xs" showText={false} isDark={true} />
                          </Box>

                          <VStack align="stretch" spacing={2} flex="1">
                            <Box
                              bg={assistantCardBg}
                              p={{ base: 4, md: 5 }}
                              borderRadius="2xl"
                              borderBottomLeftRadius="sm"
                              border="1px solid"
                              borderColor={assistantCardBorder}
                              boxShadow={assistantCardShadow}
                            >
                              {/* Confidence Header Badge */}
                              <Flex
                                justify="space-between"
                                align="center"
                                pb={3}
                                mb={3.5}
                                borderBottom="1px solid"
                                borderColor={assistantCardBorder}
                              >
                                <HStack spacing={2}>
                                  <Box p={1} borderRadius="md" bg={useColorModeValue('#EBF2EE', '#20342F')}>
                                    <BookOpen size={13} color="#52796F" />
                                  </Box>
                                  <Text fontSize="11px" fontWeight="800" color="#52796F" textTransform="uppercase" letterSpacing="0.06em">
                                    Official Regulatory Assessment
                                  </Text>
                                </HStack>

                                <Badge
                                  fontSize="10px"
                                  fontWeight="800"
                                  px={2.5}
                                  py={0.8}
                                  borderRadius="full"
                                  border="1px solid"
                                  borderColor={
                                    msg.confidence === 'HIGH'
                                      ? useColorModeValue('green.200', 'green.800')
                                      : msg.confidence === 'MEDIUM'
                                      ? useColorModeValue('yellow.200', 'yellow.800')
                                      : useColorModeValue('red.200', 'red.800')
                                  }
                                  bg={
                                    msg.confidence === 'HIGH'
                                      ? useColorModeValue('#E8F5E9', 'rgba(46, 125, 50, 0.2)')
                                      : msg.confidence === 'MEDIUM'
                                      ? useColorModeValue('#FFF8E1', 'rgba(245, 127, 23, 0.2)')
                                      : useColorModeValue('#FFEBEE', 'rgba(198, 40, 40, 0.2)')
                                  }
                                  color={
                                    msg.confidence === 'HIGH'
                                      ? useColorModeValue('#2E7D32', '#81C784')
                                      : msg.confidence === 'MEDIUM'
                                      ? useColorModeValue('#B78103', '#FFD54F')
                                      : useColorModeValue('#C62828', '#E57373')
                                  }
                                >
                                  {msg.confidence === 'HIGH'
                                    ? 'CONFIDENCE: HIGH'
                                    : msg.confidence === 'MEDIUM'
                                    ? 'CONFIDENCE: MEDIUM'
                                    : 'STRICT REFUSAL: NOT FOUND'}
                                </Badge>
                              </Flex>

                              {/* Markdown Rendered Content */}
                              <Box className="markdown-compliance-content">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                              </Box>

                              {/* Cited Rules Section (Hidden on Refusal / NOT_FOUND) */}
                              {msg.confidence !== 'NOT_FOUND' && msg.citedRules && msg.citedRules.length > 0 && (
                                <Box mt={4} pt={3.5} borderTopWidth="1px" borderColor={assistantCardBorder}>
                                  <Text
                                    fontSize="11px"
                                    fontWeight="800"
                                    color="#52796F"
                                    mb={2}
                                    textTransform="uppercase"
                                    letterSpacing="0.05em"
                                  >
                                    Cited UK Rule Excerpts (Click to inspect):
                                  </Text>
                                  <HStack wrap="wrap" spacing={2}>
                                    {msg.citedRules.map((cite, cIdx) => (
                                      <Tag
                                        key={cIdx}
                                        size="md"
                                        bg={citedTagBg}
                                        color="#52796F"
                                        borderRadius="lg"
                                        border="1.5px solid"
                                        borderColor={citedTagBorder}
                                        cursor="pointer"
                                        onClick={() => openCitation(cite)}
                                        _hover={{
                                          bg: threadHoverBg,
                                          borderColor: '#52796F',
                                          transform: 'translateY(-1px)',
                                        }}
                                        transition="all 0.15s"
                                        py={1}
                                        px={2.5}
                                      >
                                        <TagLeftIcon as={BookOpen} size={14} color="#52796F" />
                                        <TagLabel fontWeight="700" fontSize="xs">
                                          {cite.ruleCode || cite.ruleTitle}
                                        </TagLabel>
                                      </Tag>
                                    ))}
                                  </HStack>
                                </Box>
                              )}
                            </Box>

                            {/* Dynamic Suggested Follow-Up Prompts */}
                            {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                              <VStack align="start" spacing={2} pl={1} pt={1}>
                                <HStack spacing={1.5}>
                                  <Sparkles size={13} color="#52796F" />
                                  <Text fontSize="11px" color="#52796F" fontWeight="800" textTransform="uppercase" letterSpacing="0.05em">
                                    Suggested Inquiries:
                                  </Text>
                                </HStack>
                                <HStack wrap="wrap" spacing={2}>
                                  {msg.suggestedFollowUps.map((q, qIdx) => (
                                    <Button
                                      key={qIdx}
                                      size="sm"
                                      variant="outline"
                                      bg={citedTagBg}
                                      color={threadTextColor}
                                      borderColor={citedTagBorder}
                                      borderRadius="xl"
                                      rightIcon={<ArrowRight size={13} color="#52796F" />}
                                      onClick={() => handleSend(q)}
                                      _hover={{
                                        bg: threadHoverBg,
                                        borderColor: '#52796F',
                                        color: '#52796F',
                                        transform: 'translateY(-1px)',
                                      }}
                                      fontSize="12.5px"
                                      fontWeight="600"
                                      h="auto"
                                      py={2}
                                      px={3.5}
                                      textAlign="left"
                                      whiteSpace="normal"
                                    >
                                      {q}
                                    </Button>
                                  ))}
                                </HStack>
                              </VStack>
                            )}
                          </VStack>
                        </HStack>
                      </Flex>
                    )}
                  </Box>
                ))}

                {/* Inquiry Processing Spinner */}
                {isSending && (
                  <Flex justify="flex-start" pl={12}>
                    <HStack
                      bg={assistantCardBg}
                      p={3}
                      borderRadius="2xl"
                      border="1px solid"
                      borderColor={assistantCardBorder}
                      spacing={3}
                    >
                      <Spinner size="sm" color="#52796F" />
                      <Text fontSize="xs" color="#52796F" fontWeight="600">
                        Searching UK financial rules & synthesizing grounded compliance answer...
                      </Text>
                    </HStack>
                  </Flex>
                )}

                <div ref={chatBottomRef} />
              </VStack>
            </Box>

            {/* Bottom Input Field */}
            <Box p={{ base: 3, md: 4 }} borderTopWidth="1px" borderColor={sidebarBorder} bg={bottomBarBg}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
              >
                <HStack spacing={2.5}>
                  <Input
                    ref={inputRef}
                    placeholder="Ask any question about UK financial regulations (e.g. 'What are the principles under FCA PRIN 2.1.1?')..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    bg={inputBg}
                    borderColor={inputBorder}
                    color={inputTextColor}
                    _hover={{ borderColor: '#52796F' }}
                    _focus={{ borderColor: '#52796F', boxShadow: '0 0 0 1px #52796F' }}
                    borderRadius="xl"
                    py={5}
                    fontSize="sm"
                    disabled={isSending}
                  />
                  <Button
                    type="submit"
                    colorScheme="brand"
                    bg="#52796F"
                    color="white"
                    _hover={{ bg: '#3D5A52' }}
                    borderRadius="xl"
                    px={5}
                    py={5}
                    isLoading={isSending}
                    isDisabled={!input.trim()}
                    rightIcon={<Send size={15} />}
                  >
                    Ask
                  </Button>
                </HStack>
              </form>
              <Text fontSize="2xs" color="gray.400" textAlign="center" mt={2}>
                All answers are strictly verified and grounded in official UK statutory rules (FCA, PRA, Bank of England). Multi-turn conversation memory active.
              </Text>
            </Box>
          </Flex>
        </Card>
      </Container>

      {/* Citations Inspector Drawer */}
      <CitationDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        citation={activeCitation}
      />

      {/* Guest 2-Chat Limit Modal */}
      <Modal isOpen={limitModalOpen} onClose={() => setLimitModalOpen(false)} isCentered size="md">
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="3xl" p={2}>
          <ModalHeader pb={1}>
            <HStack spacing={2} color="#52796F">
              <Lock size={20} />
              <Text fontWeight="800">Preview Inquiry Limit Reached</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={3} align="start">
              <Text fontSize="sm" color="gray.600">
                You have reached your <strong>2 free guest preview inquiries</strong>. To continue asking unlimited questions and save your conversation threads, please create an account or sign in.
              </Text>
              <Box p={3} bg="#F4F7F5" borderRadius="xl" w="full">
                <Text fontSize="xs" fontWeight="700" color="#52796F">
                  Account Benefits:
                </Text>
                <Text fontSize="xs" color="#52796F" mt={1}>
                  • Unlimited regulatory searches across FCA, PRA, and Bank of England<br />
                  • Persistent multi-turn conversation memory & past chat threads<br />
                  • Full clause-level citations with interactive source text inspection<br />
                  • Real-time broadcast alerts on regulatory rule amendments
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter gap={2}>
            <Button
              variant="outline"
              colorScheme="brand"
              borderRadius="xl"
              leftIcon={<LogIn size={15} />}
              onClick={() => {
                setLimitModalOpen(false);
                navigate('/login');
              }}
            >
              Sign In
            </Button>
            <Button
              colorScheme="brand"
              bg="#52796F"
              color="white"
              borderRadius="xl"
              leftIcon={<UserPlus size={15} />}
              onClick={() => {
                setLimitModalOpen(false);
                navigate('/login?tab=register');
              }}
            >
              Create Free Account
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};
