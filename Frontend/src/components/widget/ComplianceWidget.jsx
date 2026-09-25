import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Input,
  IconButton,
  Button,
  Badge,
  Spinner,
  Collapse,
  Tooltip,
} from '@chakra-ui/react';
import {
  Send,
  MessageSquare,
  X,
  RotateCcw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { agentApi } from '../../api/agent.api.js';

const STORAGE_KEY = 'uk_finance_widget_session_id';

const getOrCreateWidgetSessionId = () => {
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId || sessionId.length < 8) {
    sessionId = 'wgt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
};

const STARTER_QUESTIONS = [
  'What are the FCA DISP time limits for resolving a customer complaint?',
  'Under PROD 4 and Consumer Duty, how must firms assess fair value?',
  'What must firms report to the FCA under SUP 15 and FCG financial crime controls?',
];

/**
 * Ensures widget responses remain concise and compact.
 * If the user did NOT explicitly ask for a table, converts any Markdown table
 * into short bullet points and removes trailing boilerplate disclaimers.
 */
const formatConciseWidgetMessage = (markdownText = '', questionText = '') => {
  if (!markdownText) return '';
  const askedForTable = /\b(table|tabular|columns|grid|matrix)\b/i.test(questionText || '');

  let text = markdownText
    .replace(/\n*_?All excerpts are taken verbatim[^\n]*_?\s*$/gi, '')
    .replace(/【\d+†[^】]+】/g, '')
    .trim();

  if (askedForTable) {
    return text;
  }

  // Convert Markdown tables into concise bullet points if present
  const lines = text.split('\n');
  const out = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isTableRow = line.startsWith('|') && line.endsWith('|') && line.split('|').length > 2;
    const isSeparatorRow = isTableRow && /^[\s|:\-]+$/.test(line);

    if (isTableRow) {
      const cells = line
        .slice(1, -1)
        .split('|')
        .map((c) => c.trim().replace(/<br\s*\/?>/gi, '; '));

      if (!inTable) {
        inTable = true; // skip header row
      } else if (!isSeparatorRow) {
        const primary = cells[0] || '';
        const details = cells
          .slice(1)
          .filter(Boolean)
          .join(' — ');
        if (primary || details) {
          out.push(`- ${primary.startsWith('**') ? primary : `**${primary}**`}: ${details}`);
        }
      }
    } else {
      if (inTable) {
        inTable = false;
      }
      // Skip redundant "### Summary" or "---" blocks if we already extracted concise bullets
      if (/^#{1,4}\s*Summary$/i.test(line) || /^#{1,4}\s*References$/i.test(line)) {
        break;
      }
      out.push(lines[i]);
    }
  }

  let cleaned = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (cleaned.length > 950) {
    const blocks = cleaned.split('\n\n');
    let acc = '';
    for (const b of blocks) {
      if ((acc + '\n\n' + b).length > 900 && acc.length > 300) break;
      acc = acc ? `${acc}\n\n${b}` : b;
    }
    cleaned = acc.trim();
  }
  return cleaned;
};

/**
 * Reusable React AI Compliance Widget Component
 * Connected to the exact same agentApi.queryAgent RAG + 4-Tier Cache pipeline as /chat
 */
export const ComplianceWidget = ({
  mode = 'floating',
  defaultOpen = false,
  title = 'UK Financial Rules AI',
  buttonLabel = 'Ask UK Compliance AI',
}) => {
  const isIframeMode = mode === 'iframe';
  const [isOpen, setIsOpen] = useState(isIframeMode ? true : defaultOpen);
  const [widgetSessionId, setWidgetSessionId] = useState(getOrCreateWidgetSessionId);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCitations, setExpandedCitations] = useState({});

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Lock background page scroll when floating widget modal is open
  useEffect(() => {
    if (isIframeMode) return;
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow || '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, isIframeMode]);

  // Restore session from shared Express Backend
  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      setInitializing(true);
      try {
        const res = await agentApi.getWidgetSession(widgetSessionId);
        const payload = res?.data || res || {};
        const restored = (payload.messages || []).filter(
          (m) => m.content !== 'No response received.'
        );
        if (active) {
          if (payload.conversationId) {
            setConversationId(payload.conversationId);
          }
          if (restored.length > 0) {
            setMessages(restored);
          }
        }
      } catch (_) {
        // Fresh session fallback
      } finally {
        if (active) setInitializing(false);
      }
    };
    restoreSession();
    return () => {
      active = false;
    };
  }, [widgetSessionId]);

  const handleSend = async (customQuestion) => {
    const questionText = (customQuestion ?? input).trim();
    if (!questionText || loading) return;

    setInput('');
    setError(null);

    const userMsg = {
      role: 'user',
      content: questionText,
      createdAt: new Date().toISOString(),
    };

    const priorHistory = messages
      .filter((m) => m.content !== 'No response received.')
      .map((m) => ({
        role: m.role,
        content: m.content,
        citedRules: m.citedRules || [],
      }));

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Uses the exact same agentApi.queryAgent RAG pipeline as ChatAssistant.jsx (/chat)
      const response = await agentApi.queryAgent(
        questionText,
        conversationId,
        priorHistory,
        widgetSessionId
      );

      // apiClient interceptor already unwraps response.data -> { success, data: { answer, citedRules, ... } }
      const data = response?.data || response || {};
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      const rawAnswer = data.answer || 'Unable to generate compliance response.';
      const assistantMsg = {
        role: 'assistant',
        content: formatConciseWidgetMessage(rawAnswer, questionText),
        confidence: data.confidence || 'HIGH',
        citedRules: data.citedRules || [],
        suggestedFollowUps: data.suggestedFollowUps || [],
        isCached: Boolean(data.isCached),
        cacheType: data.cacheType || null,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errMsg =
        err.message ||
        'Unable to reach the UK Financial Compliance Agent API. Please check your connection.';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = async () => {
    try {
      await agentApi.clearWidgetSession(widgetSessionId);
    } catch (_) {
      // ignore
    }
    const newId =
      'wgt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem(STORAGE_KEY, newId);
    setWidgetSessionId(newId);
    setConversationId(null);
    setMessages([]);
    setError(null);
    setExpandedCitations({});
  };

  const handleClose = () => {
    if (window.self !== window.top) {
      window.parent.postMessage({ type: 'UK_FINANCE_WIDGET_CLOSE' }, '*');
    } else {
      setIsOpen(false);
    }
  };

  const toggleCitations = (idx) => {
    setExpandedCitations((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const renderChatCard = () => (
    <Flex
      direction="column"
      w="100%"
      h="100%"
      bg="#FFFFFF"
      borderRadius={isIframeMode ? '0' : '20px'}
      overflow="hidden"
      boxShadow={
        isIframeMode
          ? 'none'
          : '0 24px 60px rgba(15, 35, 30, 0.24), 0 0 0 1px #E2ECE7'
      }
      fontFamily="Inter, system-ui, sans-serif"
    >
      {/* Header */}
      <Flex
        px={4}
        py={3.5}
        bg="linear-gradient(135deg, #1B3B33 0%, #2F5D50 100%)"
        color="white"
        align="center"
        justify="space-between"
        flexShrink={0}
      >
        <HStack spacing={2.5}>
          <Flex
            w="34px"
            h="34px"
            borderRadius="10px"
            bg="rgba(255, 255, 255, 0.14)"
            align="center"
            justify="center"
            border="1px solid rgba(255, 255, 255, 0.2)"
          >
            <ShieldCheck size={18} color="#A7F3D0" />
          </Flex>
          <Box>
            <HStack spacing={2}>
              <Text fontSize="sm" fontWeight="700" letterSpacing="-0.01em" lineHeight="1.2">
                {title}
              </Text>
              <Badge
                bg="rgba(16, 185, 129, 0.22)"
                color="#A7F3D0"
                fontSize="9px"
                px={1.5}
                py={0.5}
                borderRadius="full"
                textTransform="uppercase"
              >
                FCA RAG
              </Badge>
            </HStack>
            <Text fontSize="11px" color="whiteAlpha.800">
              Multi-turn memory • Verified FCA citations
            </Text>
          </Box>
        </HStack>

        <HStack spacing={1}>
          <Tooltip label="Reset conversation session" hasArrow placement="bottom">
            <IconButton
              size="xs"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: 'whiteAlpha.200' }}
              icon={<RotateCcw size={14} />}
              onClick={handleResetSession}
              aria-label="Reset conversation"
            />
          </Tooltip>
          <Tooltip label="Minimize assistant" hasArrow placement="bottom">
            <IconButton
              size="xs"
              variant="ghost"
              color="whiteAlpha.900"
              _hover={{ bg: 'whiteAlpha.200' }}
              icon={<X size={16} />}
              onClick={handleClose}
              aria-label="Close widget"
            />
          </Tooltip>
        </HStack>
      </Flex>

      {/* Messages Area */}
      <VStack
        flex={1}
        overflowY="auto"
        px={4}
        py={3.5}
        spacing={3.5}
        align="stretch"
        bg="#F7FAF8"
      >
        {initializing ? (
          <Flex flex={1} align="center" justify="center" py={10}>
            <HStack spacing={2} color="#52796F">
              <Spinner size="sm" />
              <Text fontSize="xs" fontWeight="600">
                Restoring compliance session...
              </Text>
            </HStack>
          </Flex>
        ) : messages.length === 0 ? (
          <VStack spacing={3} align="stretch" pt={2}>
            <Box
              p={3.5}
              bg="white"
              borderRadius="14px"
              border="1px solid #E2ECE7"
              boxShadow="0 2px 6px rgba(47, 62, 70, 0.04)"
            >
              <HStack spacing={2} mb={1.5}>
                <Sparkles size={15} color="#2F5D50" />
                <Text fontSize="xs" fontWeight="700" color="#1B3B33">
                  FCA Regulatory Assistant Ready
                </Text>
              </HStack>
              <Text fontSize="xs" color="#52796F" lineHeight="1.5">
                Ask any UK financial compliance question (DISP, PROD, SUP, FCG, SYSC, COBS, CASS).
                Follow-up questions with pronouns (<i>"they"</i>, <i>"them"</i>, <i>"that period"</i>) automatically remember prior turns.
              </Text>
            </Box>

            <Text fontSize="10px" fontWeight="700" color="#52796F" textTransform="uppercase" px={1}>
              Quick Starter Questions
            </Text>
            <VStack spacing={2} align="stretch">
              {STARTER_QUESTIONS.map((q, idx) => (
                <Button
                  key={idx}
                  size="xs"
                  variant="outline"
                  justifyContent="flex-start"
                  whiteSpace="normal"
                  textAlign="left"
                  h="auto"
                  py={2}
                  px={3}
                  bg="white"
                  borderColor="#D8E5DF"
                  color="#2F3E46"
                  fontWeight="500"
                  borderRadius="10px"
                  _hover={{ bg: '#EDF4F0', borderColor: '#52796F' }}
                  onClick={() => handleSend(q)}
                >
                  {q}
                </Button>
              ))}
            </VStack>
          </VStack>
        ) : (
          messages.map((msg, idx) => {
            const isUser = msg.role === 'user';
            const citations = msg.citedRules || [];
            const hasCitations = !isUser && citations.length > 0;
            const isExpanded = Boolean(expandedCitations[idx]);

            return (
              <Box
                key={idx}
                alignSelf={isUser ? 'flex-end' : 'flex-start'}
                maxW={isUser ? '86%' : '96%'}
              >
                <Box
                  px={3.5}
                  py={2.5}
                  bg={isUser ? '#2F5D50' : 'white'}
                  color={isUser ? 'white' : '#1E293B'}
                  borderRadius={
                    isUser ? '14px 14px 3px 14px' : '14px 14px 14px 3px'
                  }
                  border={isUser ? 'none' : '1px solid #E2ECE7'}
                  boxShadow="0 2px 6px rgba(15, 35, 30, 0.05)"
                  fontSize="12.5px"
                  lineHeight="1.55"
                >
                  {isUser ? (
                    <Text>{msg.content}</Text>
                  ) : (
                    <Box
                      sx={{
                        '& p': { mb: 2 },
                        '& p:last-of-type': { mb: 0 },
                        '& ul, & ol': { pl: 4, mb: 2 },
                        '& li': { mb: 1 },
                        '& h1, & h2, & h3, & h4': {
                          fontWeight: '700',
                          color: '#1B3B33',
                          mt: 2,
                          mb: 1,
                          fontSize: '13px',
                        },
                        '& table': {
                          width: '100%',
                          borderCollapse: 'collapse',
                          my: 2,
                          fontSize: '11px',
                        },
                        '& th, & td': {
                          border: '1px solid #CBD5E1',
                          px: 2,
                          py: 1,
                          textAlign: 'left',
                        },
                        '& th': { bg: '#F1F5F9', fontWeight: '700' },
                      }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {formatConciseWidgetMessage(msg.content, messages[idx - 1]?.content || '')}
                      </ReactMarkdown>
                    </Box>
                  )}
                </Box>

                {/* Suggested Follow-Ups */}
                {!isUser &&
                  idx === messages.length - 1 &&
                  Array.isArray(msg.suggestedFollowUps) &&
                  msg.suggestedFollowUps.length > 0 && (
                    <HStack spacing={1.5} mt={2} flexWrap="wrap">
                      {msg.suggestedFollowUps.slice(0, 2).map((followUp, fIdx) => (
                        <Button
                          key={fIdx}
                          size="2xs"
                          variant="outline"
                          bg="white"
                          borderColor="#CAD7D0"
                          color="#2F5D50"
                          fontSize="10px"
                          py={1}
                          px={2}
                          h="auto"
                          whiteSpace="normal"
                          textAlign="left"
                          borderRadius="full"
                          _hover={{ bg: '#EDF4F0' }}
                          onClick={() => handleSend(followUp)}
                        >
                          {followUp}
                        </Button>
                      ))}
                    </HStack>
                  )}
              </Box>
            );
          })
        )}

        {loading && (
          <HStack
            alignSelf="flex-start"
            bg="white"
            px={3.5}
            py={2.5}
            borderRadius="14px"
            border="1px solid #E2ECE7"
            spacing={2.5}
          >
            <Spinner size="xs" color="#2F5D50" />
            <Text fontSize="xs" color="#52796F" fontWeight="500">
              Searching Qdrant FCA Handbook & synthesizing...
            </Text>
          </HStack>
        )}

        {error && (
          <Box
            p={2.5}
            bg="#FEF2F2"
            border="1px solid #FECACA"
            borderRadius="10px"
            color="#B91C1C"
            fontSize="11.5px"
          >
            {error}
          </Box>
        )}

        <div ref={messagesEndRef} />
      </VStack>

      {/* Input Form */}
      <Box
        p={3}
        bg="white"
        borderTop="1px solid #E5ECE8"
        as="form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
      >
        <HStack spacing={2}>
          <Input
            size="sm"
            placeholder="Ask a UK compliance or follow-up question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            borderRadius="10px"
            bg="#F8FAF9"
            borderColor="#D5E2DC"
            _focus={{ borderColor: '#2F5D50', bg: 'white', boxShadow: 'none' }}
            fontSize="12.5px"
          />
          <IconButton
            type="submit"
            size="sm"
            bg="#2F5D50"
            color="white"
            _hover={{ bg: '#1B3B33' }}
            borderRadius="10px"
            icon={<Send size={15} />}
            isLoading={loading}
            isDisabled={!input.trim()}
            aria-label="Send compliance question"
          />
        </HStack>
      </Box>
    </Flex>
  );

  // Mode="iframe": Full-viewport isolated widget container for <iframe> embedding
  if (isIframeMode) {
    return (
      <Box w="100vw" h="100vh" overflow="hidden" bg="transparent">
        {renderChatCard()}
      </Box>
    );
  }

  // Mode="floating": Dimmed Page Backdrop Overlay + Floating Launcher Button + Popup Chat Window
  return (
    <>
      {isOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(12, 22, 20, 0.58)"
          backdropFilter="blur(3.5px)"
          zIndex={9998}
          transition="opacity 0.2s ease"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <Box position="fixed" bottom="24px" right="24px" zIndex={9999}>
        {isOpen && (
          <Box
            w={{ base: '340px', sm: '400px' }}
            h="590px"
            mb={3}
            boxShadow="0 28px 70px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(167, 243, 208, 0.35)"
            borderRadius="20px"
          >
            {renderChatCard()}
          </Box>
        )}

        <Flex justify="flex-end">
          <Button
            onClick={() => setIsOpen(!isOpen)}
            h="54px"
            px={5}
            borderRadius="full"
            bg="linear-gradient(135deg, #1B3B33 0%, #2F5D50 100%)"
            color="white"
            boxShadow="0 12px 32px rgba(27, 59, 51, 0.45)"
            _hover={{
              transform: 'translateY(-2px)',
              boxShadow: '0 16px 36px rgba(27, 59, 51, 0.55)',
            }}
            leftIcon={isOpen ? <X size={19} /> : <MessageSquare size={19} />}
            fontSize="sm"
            fontWeight="700"
          >
            {isOpen ? 'Close Assistant' : buttonLabel}
          </Button>
        </Flex>
      </Box>
    </>
  );
};
