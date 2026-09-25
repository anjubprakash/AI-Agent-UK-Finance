import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Code,
  SimpleGrid,
  useToast,
} from '@chakra-ui/react';
import {
  BookOpen,
  Copy,
  Check,
  Code2,
  Layers,
  Monitor,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { ComplianceWidget } from '../components/widget/ComplianceWidget.jsx';

export const WidgetChat = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const isEmbeddedIframe =
    searchParams.get('embed') === 'true' || window.self !== window.top;

  const [copiedTab, setCopiedTab] = useState(null);
  const [previewMode, setPreviewMode] = useState('floating'); // 'floating' | 'iframe'
  const toast = useToast();

  // 1. When loaded inside an <iframe> (/widget?embed=true), render ONLY the isolated React Widget UI
  if (isEmbeddedIframe) {
    return <ComplianceWidget mode="iframe" defaultOpen={true} />;
  }

  // 2. When opened at http://localhost:8080/widget in browser, render the React Widget Studio & Live Simulator
  const origin = window.location.origin; // e.g., http://localhost:8080
  const scriptSnippet = `<!-- Paste before </body> on any external website -->\n<script src="${origin}/widget.js" defer></script>`;
  const iframeSnippet = `<iframe\n  src="${origin}/widget?embed=true"\n  width="390"\n  height="580"\n  style="border:none;border-radius:20px;box-shadow:0 20px 50px rgba(0,0,0,0.18);"\n  title="UK Financial Rules AI Compliance Widget"\n></iframe>`;
  const reactComponentSnippet = `import { ComplianceWidget } from './components/widget/ComplianceWidget.jsx';\n\n// Drop anywhere in any React page:\n<ComplianceWidget mode="floating" defaultOpen={false} />`;

  const copySnippet = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(key);
    toast({
      title: 'Widget code copied!',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
    setTimeout(() => setCopiedTab(null), 2000);
  };

  return (
    <Box minH="100vh" bg="#F3F7F5" py={8} px={{ base: 4, md: 10 }}>
      <Box maxW="1160px" mx="auto">
        {/* Top Header */}
        <Flex justify="space-between" align="center" mb={7} flexWrap="wrap" gap={4}>
          <HStack spacing={3.5}>
            <Flex
              w="46px"
              h="46px"
              borderRadius="14px"
              bg="linear-gradient(135deg, #1B3B33 0%, #2F5D50 100%)"
              color="white"
              align="center"
              justify="center"
              boxShadow="0 8px 20px rgba(27, 59, 51, 0.22)"
            >
              <Layers size={22} />
            </Flex>
            <Box>
              <HStack spacing={2.5}>
                <Text fontSize="xl" fontWeight="800" color="#1B3B33">
                  Frontend React AI Compliance Widget Studio
                </Text>
                <Badge colorScheme="green" borderRadius="full" px={2.5} py={0.5}>
                  REACT + IFRAME READY
                </Badge>
              </HStack>
              <Text fontSize="sm" color="#52796F">
                Built 100% in React (<Code fontSize="xs">ComplianceWidget.jsx</Code>) • Shared Express RAG Backend (<Code fontSize="xs">/api/agent/query</Code>)
              </Text>
            </Box>
          </HStack>

          <HStack spacing={2.5}>
            <Button
              size="sm"
              leftIcon={<MessageSquare size={15} />}
              bg={previewMode === 'floating' ? '#2F5D50' : 'white'}
              color={previewMode === 'floating' ? 'white' : '#2F5D50'}
              border="1px solid #2F5D50"
              _hover={{ bg: '#1B3B33', color: 'white' }}
              onClick={() => setPreviewMode('floating')}
            >
              Floating Launcher Mode
            </Button>
            <Button
              size="sm"
              leftIcon={<Monitor size={15} />}
              bg={previewMode === 'iframe' ? '#2F5D50' : 'white'}
              color={previewMode === 'iframe' ? 'white' : '#2F5D50'}
              border="1px solid #2F5D50"
              _hover={{ bg: '#1B3B33', color: 'white' }}
              onClick={() => setPreviewMode('iframe')}
            >
              Live Iframe Container Preview
            </Button>
            <Button
              as={RouterLink}
              to="/chat"
              size="sm"
              variant="outline"
              borderColor="#CAD7D0"
              color="#1B3B33"
              bg="white"
            >
              Back to Main Chat
            </Button>
          </HStack>
        </Flex>

        <SimpleGrid columns={{ base: 1, lg: 12 }} spacing={7} alignItems="start">
          {/* Left Column: Embed Snippets & Architecture Summary */}
          <VStack spacing={4} align="stretch" gridColumn={{ base: 'span 1', lg: 'span 7' }}>
            {/* Option 1: React Component */}
            <Box
              p={5}
              bg="white"
              borderRadius="16px"
              border="1px solid #DCE7E2"
              boxShadow="0 4px 16px rgba(15,35,30,0.04)"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={2}>
                  <ShieldCheck size={18} color="#2F5D50" />
                  <Text fontWeight="700" fontSize="sm" color="#1B3B33">
                    Option 1: React Component (<Code fontSize="xs">&lt;ComplianceWidget /&gt;</Code>)
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  leftIcon={copiedTab === 'react' ? <Check size={13} /> : <Copy size={13} />}
                  onClick={() => copySnippet(reactComponentSnippet, 'react')}
                  colorScheme="teal"
                  variant="subtle"
                >
                  {copiedTab === 'react' ? 'Copied' : 'Copy JSX'}
                </Button>
              </Flex>
              <Text fontSize="xs" color="#52796F" mb={2.5}>
                Import the self-contained React widget directly inside any React application or page.
              </Text>
              <Box
                as="pre"
                p={3}
                bg="#0F172A"
                color="#E2E8F0"
                borderRadius="10px"
                fontSize="11.5px"
                overflowX="auto"
              >
                {reactComponentSnippet}
              </Box>
            </Box>

            {/* Option 2: Iframe Embed */}
            <Box
              p={5}
              bg="white"
              borderRadius="16px"
              border="1px solid #DCE7E2"
              boxShadow="0 4px 16px rgba(15,35,30,0.04)"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={2}>
                  <BookOpen size={18} color="#2F5D50" />
                  <Text fontWeight="700" fontSize="sm" color="#1B3B33">
                    Option 2: Isolated <Code fontSize="xs">&lt;iframe&gt;</Code> Embed (Any External Website)
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  leftIcon={copiedTab === 'iframe' ? <Check size={13} /> : <Copy size={13} />}
                  onClick={() => copySnippet(iframeSnippet, 'iframe')}
                  colorScheme="teal"
                  variant="subtle"
                >
                  {copiedTab === 'iframe' ? 'Copied' : 'Copy Iframe'}
                </Button>
              </Flex>
              <Text fontSize="xs" color="#52796F" mb={2.5}>
                Loads the React widget route (<Code fontSize="xs">{origin}/widget?embed=true</Code>) inside an isolated iframe so styles never clash with the host page.
              </Text>
              <Box
                as="pre"
                p={3}
                bg="#0F172A"
                color="#E2E8F0"
                borderRadius="10px"
                fontSize="11.5px"
                overflowX="auto"
              >
                {iframeSnippet}
              </Box>
            </Box>

            {/* Option 3: 1-Line Frontend Script Loader */}
            <Box
              p={5}
              bg="white"
              borderRadius="16px"
              border="1px solid #DCE7E2"
              boxShadow="0 4px 16px rgba(15,35,30,0.04)"
            >
              <Flex justify="space-between" align="center" mb={2}>
                <HStack spacing={2}>
                  <Code2 size={18} color="#2F5D50" />
                  <Text fontWeight="700" fontSize="sm" color="#1B3B33">
                    Option 3: 1-Line Floating Launcher Script (Served from Frontend 8080)
                  </Text>
                </HStack>
                <Button
                  size="xs"
                  leftIcon={copiedTab === 'script' ? <Check size={13} /> : <Copy size={13} />}
                  onClick={() => copySnippet(scriptSnippet, 'script')}
                  colorScheme="teal"
                  variant="subtle"
                >
                  {copiedTab === 'script' ? 'Copied' : 'Copy Script'}
                </Button>
              </Flex>
              <Text fontSize="xs" color="#52796F" mb={2.5}>
                Automatically mounts the floating launcher button and React iframe on any external website.
              </Text>
              <Box
                as="pre"
                p={3}
                bg="#0F172A"
                color="#E2E8F0"
                borderRadius="10px"
                fontSize="11.5px"
                overflowX="auto"
              >
                {scriptSnippet}
              </Box>
            </Box>
          </VStack>

          {/* Right Column: Live Interactive Iframe / Host Simulator Box */}
          <Box gridColumn={{ base: 'span 1', lg: 'span 5' }}>
            <Box
              p={4}
              bg="white"
              borderRadius="20px"
              border="1px solid #DCE7E2"
              boxShadow="0 8px 30px rgba(15,35,30,0.06)"
            >
              <HStack justify="space-between" mb={3}>
                <HStack spacing={2}>
                  <Box w="8px" h="8px" borderRadius="full" bg="#10B981" />
                  <Text fontSize="xs" fontWeight="700" color="#1B3B33">
                    Live Isolated Iframe Container (<Code fontSize="10px">/widget?embed=true</Code>)
                  </Text>
                </HStack>
                <Badge colorScheme="teal" fontSize="9px">
                  390 × 560 px
                </Badge>
              </HStack>

              <Box
                w="100%"
                h="560px"
                borderRadius="16px"
                overflow="hidden"
                border="1px solid #E2ECE7"
              >
                <iframe
                  src={`${origin}/widget?embed=true`}
                  title="Live Embedded React Compliance Widget"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              </Box>
            </Box>
          </Box>
        </SimpleGrid>
      </Box>

      {/* Floating React Widget Component in Bottom-Right Corner */}
      {previewMode === 'floating' && (
        <ComplianceWidget mode="floating" defaultOpen={true} />
      )}
    </Box>
  );
};
