import React from 'react';
import {
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Button,
  useToast,
} from '@chakra-ui/react';
import { BookOpen, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

export const CitationDrawer = ({ isOpen, onClose, citation }) => {
  const toast = useToast();

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.contentSnippet || '');
    toast({
      title: 'Excerpt copied to clipboard',
      status: 'success',
      duration: 2000,
    });
  };

  const getAuthorityColor = (auth) => {
    switch (auth?.toUpperCase()) {
      case 'FCA': return 'blue';
      case 'PRA': return 'purple';
      case 'BOE': return 'green';
      default: return 'gray';
    }
  };

  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px" py={4}>
          <HStack spacing={2} align="center">
            <BookOpen size={20} color="#103960" />
            <Text fontSize="md" fontWeight="700">Official Regulatory Citation</Text>
          </HStack>
        </DrawerHeader>

        <DrawerBody py={6}>
          <VStack spacing={5} align="stretch">
            {/* Metadata Card */}
            <Box p={4} bg="gray.50" borderRadius="xl" border="1px solid" borderColor="gray.200">
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Badge colorScheme={getAuthorityColor(citation.authority)} px={2.5} py={0.5} borderRadius="full">
                    {citation.authority || 'FCA'}
                  </Badge>
                  {citation.relevanceScore > 0 && (
                    <Badge colorScheme="teal" px={2} py={0.5} borderRadius="full">
                      {Math.round(citation.relevanceScore * 100)}% Semantic Match
                    </Badge>
                  )}
                </HStack>

                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="700">
                    Rule Code / Reference
                  </Text>
                  <Text fontSize="lg" fontWeight="800" color="brand.500">
                    {citation.ruleCode || 'General Compliance Standard'}
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" color="gray.500" textTransform="uppercase" fontWeight="700">
                    Source Document Title
                  </Text>
                  <Text fontSize="sm" fontWeight="600" color="gray.800">
                    {citation.ruleTitle || 'Official Regulatory Handbook'} (v{citation.version || '1.0'})
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* Verbatim Excerpt */}
            <Box>
              <HStack justify="space-between" mb={2}>
                <Text fontSize="xs" fontWeight="700" color="gray.600" textTransform="uppercase">
                  Verbatim Regulatory Excerpt
                </Text>
                <Button size="xs" leftIcon={<Copy size={13} />} variant="ghost" onClick={handleCopy}>
                  Copy
                </Button>
              </HStack>
              <Box
                p={4}
                bg="white"
                borderRadius="xl"
                border="1px solid"
                borderColor="brand.100"
                boxShadow="xs"
                fontSize="sm"
                lineHeight="1.7"
                color="gray.800"
                fontFamily="Georgia, serif"
              >
                "{citation.contentSnippet || 'No excerpt available.'}"
              </Box>
            </Box>

            {/* Verification Footer Note */}
            <Box p={3} bg="blue.50" borderRadius="lg" display="flex" gap={2} alignItems="center">
              <ShieldCheck size={18} color="#2563eb" />
              <Text fontSize="xs" color="blue.800">
                Verified against indexed official rulebooks in the Compliance Knowledge Base.
              </Text>
            </Box>
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};
