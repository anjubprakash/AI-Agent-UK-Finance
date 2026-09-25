import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Box,
  Divider,
  CircularProgress,
  CircularProgressLabel,
  Progress,
  useColorModeValue,
} from '@chakra-ui/react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ArrowRight,
  BookOpen,
  Cpu,
  Layers,
  Sparkles,
  RotateCcw,
  WifiOff,
  FileWarning,
} from 'lucide-react';

export const AiGatekeeperModal = ({
  isOpen,
  onClose,
  isProcessing,
  progress = 0,
  currentFileName = '',
  currentAuthority = 'FCA',
  customStageSubtitle = '',
  result,
  isError,
  errorMessage,
  onResetForm,
}) => {
  const navigate = useNavigate();

  const modalBg = useColorModeValue('white', '#141E1C');
  const innerBoxBg = useColorModeValue('#F4F7F5', '#182724');
  const innerBoxBorder = useColorModeValue('#CAD7D0', '#263B36');
  const sectionBg = useColorModeValue('gray.50', '#162320');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const subTextColor = useColorModeValue('gray.500', '#94A3B8');
  const footerBg = useColorModeValue('gray.50', '#182724');
  const dividerBorder = useColorModeValue('gray.200', '#263B36');
  const circularTrack = useColorModeValue('#E5ECE8', '#263B36');
  const stageBadgeBg = useColorModeValue('#E5ECE8', '#263B36');
  const stepActiveColor = useColorModeValue('green.800', 'green.300');
  const stepInactiveBg = useColorModeValue('gray.300', '#2B3F3B');
  const stepInactiveColor = useColorModeValue('gray.400', 'gray.600');
  const successBoxBg = useColorModeValue('green.50', 'rgba(16, 185, 129, 0.1)');
  const successBoxBorder = useColorModeValue('green.200', 'rgba(16, 185, 129, 0.25)');
  const successTitleColor = useColorModeValue('green.800', 'green.300');
  const successTextColor = useColorModeValue('green.900', 'green.100');
  const errDuplicateBg = useColorModeValue('blue.50', 'rgba(59, 130, 246, 0.1)');
  const errDuplicateBorder = useColorModeValue('blue.200', 'rgba(59, 130, 246, 0.25)');
  const errDuplicateTitle = useColorModeValue('blue.700', 'blue.300');
  const errDuplicateText = useColorModeValue('blue.900', 'blue.100');
  const errOfflineBg = useColorModeValue('orange.50', 'rgba(249, 115, 22, 0.1)');
  const errOfflineBorder = useColorModeValue('orange.200', 'rgba(249, 115, 22, 0.25)');
  const errOfflineTitle = useColorModeValue('orange.700', 'orange.300');
  const errOfflineText = useColorModeValue('orange.900', 'orange.100');
  const errRejectedBg = useColorModeValue('red.50', 'rgba(239, 68, 68, 0.1)');
  const errRejectedBorder = useColorModeValue('red.200', 'rgba(239, 68, 68, 0.25)');
  const errRejectedTitle = useColorModeValue('red.700', 'red.300');
  const errRejectedText = useColorModeValue('red.800', 'red.100');

  const errLower = (errorMessage || '').toLowerCase();

  const isNetworkOrOffline =
    errLower.includes('network error') ||
    errLower.includes('failed to fetch') ||
    errLower.includes('offline') ||
    errLower.includes('unreachable') ||
    errLower.includes('unavailable') ||
    errLower.includes('503') ||
    errLower.includes('econnrefused') ||
    errLower.includes('connection refused') ||
    errLower.includes('proxy error');

  const isDuplicate =
    errLower.includes('duplicate') ||
    errLower.includes('already registered') ||
    errLower.includes('already present') ||
    errLower.includes('already indexed');

  const isEmptyOrUnreadable =
    errLower.includes('empty') ||
    errLower.includes('unreadable') ||
    errLower.includes('could not parse') ||
    errLower.includes('unsupported file') ||
    errLower.includes('no text content');

  const isGatekeeperRejection =
    !isNetworkOrOffline &&
    !isDuplicate &&
    !isEmptyOrUnreadable;

  const formatSimpleRejectionReason = (rawReason) => {
    if (!rawReason) {
      return 'The uploaded document does not meet official UK financial regulatory criteria and cannot be indexed.';
    }

    let cleaned = rawReason
      .replace(/^ai gatekeeper rejected document:\s*/i, '')
      .trim();

    // Replace verbose technical AI checkpoints phrasing with clean user language
    cleaned = cleaned.replace(/^the sampled checkpoints (describe|indicate|show|contain)\s+/i, 'The document was identified as ');
    cleaned = cleaned.replace(/^sampled checkpoints (describe|indicate|show|contain)\s+/i, 'The document was identified as ');
    cleaned = cleaned.replace(/^the document's sampled checkpoints (describe|indicate|show)\s+/i, 'The document was identified as ');

    // Remove redundant boilerplate tail
    cleaned = cleaned.replace(/\s*therefore it is not an official or relevant uk financial regulatory document and must be rejected\.?/i, '');
    cleaned = cleaned.replace(/\s*therefore,? it must be rejected\.?/i, '');
    cleaned = cleaned.replace(/\s*and must be rejected\.?/i, '');

    return cleaned;
  };

  const cleanGatekeeperReason = errorMessage
    ? formatSimpleRejectionReason(errorMessage)
    : 'The uploaded document does not meet official UK Financial Regulatory guidelines (FCA / PRA / Bank of England) and cannot be indexed into the knowledge base.';

  // Dynamic ribbon color
  const ribbonColor = isProcessing
    ? '#52796F'
    : !isError
    ? 'green.500'
    : isDuplicate
    ? 'blue.500'
    : isNetworkOrOffline || isEmptyOrUnreadable
    ? 'orange.500'
    : 'red.500';

  // Dynamic icon bg & color
  const iconBg = isProcessing
    ? '#F4F7F5'
    : !isError
    ? 'green.50'
    : isDuplicate
    ? 'blue.50'
    : isNetworkOrOffline || isEmptyOrUnreadable
    ? 'orange.50'
    : 'red.50';

  const iconColor = isProcessing
    ? '#52796F'
    : !isError
    ? 'green.500'
    : isDuplicate
    ? 'blue.500'
    : isNetworkOrOffline || isEmptyOrUnreadable
    ? 'orange.500'
    : 'red.500';

  // Current stage description based on progress
  let currentStage = 'Stage 1 of 3: AI Gatekeeper Inspection';
  let stageSubtitle = 'Verifying UK financial regulatory authenticity & statutory authority (FCA / PRA)...';
  if (progress >= 20 && progress < 28) {
    currentStage = 'Stage 2 of 3: Structural Rule Parsing';
    stageSubtitle = 'Extracting sections, hierarchical rule codes, and transitional schedules...';
  } else if (progress >= 28 && progress < 100) {
    currentStage = 'Stage 3 of 3: Knowledge Base Vector Indexing';
    stageSubtitle = customStageSubtitle || 'Generating high-speed semantic embeddings and indexing into compliance database...';
  } else if (progress >= 100) {
    currentStage = 'Finalizing Ingestion';
    stageSubtitle = customStageSubtitle || 'Document verification and indexing complete!';
  }

  if (customStageSubtitle) {
    stageSubtitle = customStageSubtitle;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
      closeOnEsc={false}
    >
      <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(5px)" />
      <ModalContent bg={modalBg} borderRadius="2xl" overflow="hidden" boxShadow="2xl" mx={4}>
        {/* Header Ribbon */}
        <Box h="5px" bg={ribbonColor} />

        {/* Modal Header */}
        <ModalHeader pt={6} pb={2} textAlign="center">
          <VStack spacing={3}>
            {isProcessing ? (
              progress >= 25 ? (
                /* INGESTION & VECTOR INDEXING: Show Circular Progress Ring ONLY when actually indexing */
                <Box position="relative" display="inline-flex" alignItems="center" justifyContent="center">
                  <CircularProgress
                    value={progress}
                    size="90px"
                    thickness="8px"
                    color="#52796F"
                    trackColor={circularTrack}
                    capIsRound
                  >
                    <CircularProgressLabel fontSize="lg" fontWeight="900" color={headingColor}>
                      {progress}%
                    </CircularProgressLabel>
                  </CircularProgress>
                </Box>
              ) : (
                /* GATEKEEPER INSPECTION: Dedicated Inspection Shield (No premature 30% progress ring!) */
                <Box
                  p={3.5}
                  borderRadius="full"
                  bg={iconBg}
                  color="#52796F"
                  display="inline-flex"
                  alignItems="center"
                  justifyContent="center"
                  boxShadow="0 0 0 8px rgba(82, 121, 111, 0.12)"
                >
                  <ShieldCheck size={44} />
                </Box>
              )
            ) : (
              <Box p={3.5} borderRadius="full" bg={iconBg} color={iconColor}>
                {!isError ? (
                  <ShieldCheck size={44} />
                ) : isDuplicate ? (
                  <FileText size={44} />
                ) : isNetworkOrOffline ? (
                  <WifiOff size={44} />
                ) : isEmptyOrUnreadable ? (
                  <FileWarning size={44} />
                ) : (
                  <ShieldAlert size={44} />
                )}
              </Box>
            )}

            <VStack spacing={1}>
              <Text fontSize="xl" fontWeight="800" color={headingColor} textAlign="center">
                {isProcessing
                  ? progress >= 25
                    ? 'Ingesting & Indexing Rulebook'
                    : 'AI Gatekeeper Inspecting Document'
                  : !isError
                  ? 'AI Gatekeeper Verification Approved'
                  : isDuplicate
                  ? 'Rulebook Already Registered'
                  : isNetworkOrOffline
                  ? 'Backend Server Connection Failed'
                  : isEmptyOrUnreadable
                  ? 'Unreadable or Empty Document'
                  : 'Document Not Approved by AI Gatekeeper'}
              </Text>
              {isProcessing && (
                <Badge bg={stageBadgeBg} color="#52796F" px={2.5} py={0.5} borderRadius="full" fontSize="11px" fontWeight="700">
                  {progress >= 25 ? currentStage : 'Stage 1: UK Regulatory Authority Verification'}
                </Badge>
              )}
            </VStack>
          </VStack>
        </ModalHeader>

        {/* Modal Body */}
        <ModalBody py={4}>
          {isProcessing ? (
            /* ACTIVE INGESTION / PROCESSING STATE */
            <VStack spacing={4} align="stretch">
              <Box p={3.5} bg={innerBoxBg} borderRadius="xl" border="1px solid" borderColor={innerBoxBorder}>
                <HStack justify="space-between" mb={1.5}>
                  <Text fontSize="xs" fontWeight="700" color={headingColor} noOfLines={1}>
                    {currentFileName || 'Regulatory Rulebook'}
                  </Text>
                  <Badge bg="#52796F" color="white" fontSize="10px" px={2} py={0.5} borderRadius="md">
                    {currentAuthority}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="#52796F" fontWeight="600">
                  {stageSubtitle}
                </Text>
              </Box>

              {/* Multi-Stage Stepper Checklist */}
              <VStack spacing={2.5} align="stretch" p={3.5} bg={sectionBg} borderRadius="xl">
                {/* Step 1 */}
                <HStack spacing={3}>
                  <Box
                    w="22px"
                    h="22px"
                    borderRadius="full"
                    bg={progress >= 25 ? 'green.500' : '#52796F'}
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="11px"
                    fontWeight="700"
                    flexShrink={0}
                  >
                    {progress >= 25 ? <CheckCircle2 size={14} /> : <Sparkles size={13} />}
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" fontWeight="700" color={progress >= 25 ? stepActiveColor : headingColor}>
                      AI Gatekeeper Authenticity Verification
                    </Text>
                    <Text fontSize="11px" color={subTextColor}>
                      {progress >= 25 ? 'Verified official UK regulatory sourcebook' : 'Inspecting regulatory authority & handbook citations...'}
                    </Text>
                  </VStack>
                </HStack>

                <Divider borderColor={dividerBorder} />

                {/* Step 2 */}
                <HStack spacing={3}>
                  <Box
                    w="22px"
                    h="22px"
                    borderRadius="full"
                    bg={progress >= 28 ? 'green.500' : progress >= 25 ? '#52796F' : stepInactiveBg}
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="11px"
                    fontWeight="700"
                    flexShrink={0}
                  >
                    {progress >= 28 ? <CheckCircle2 size={14} /> : '2'}
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" fontWeight="700" color={progress >= 28 ? stepActiveColor : progress >= 25 ? headingColor : stepInactiveColor}>
                      Handbook Structure & Semantic Clause Chunking
                    </Text>
                    <Text fontSize="11px" color={subTextColor}>
                      Splits into cohesive statutory rules and schedules
                    </Text>
                  </VStack>
                </HStack>

                <Divider borderColor={dividerBorder} />

                {/* Step 3 */}
                <HStack spacing={3}>
                  <Box
                    w="22px"
                    h="22px"
                    borderRadius="full"
                    bg={progress >= 100 ? 'green.500' : progress >= 28 ? '#52796F' : stepInactiveBg}
                    color="white"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    fontSize="11px"
                    fontWeight="700"
                    flexShrink={0}
                  >
                    {progress >= 100 ? <CheckCircle2 size={14} /> : '3'}
                  </Box>
                  <VStack align="start" spacing={0} flex={1}>
                    <Text fontSize="xs" fontWeight="700" color={progress >= 100 ? stepActiveColor : progress >= 28 ? headingColor : stepInactiveColor}>
                      Vector Knowledge Base Indexing
                    </Text>
                    <Text fontSize="11px" color={subTextColor}>
                      Embeds fast 384-dim vectors for employee compliance search
                    </Text>
                  </VStack>
                </HStack>
              </VStack>

              {progress >= 25 ? (
                <Progress
                  value={progress}
                  size="xs"
                  colorScheme="teal"
                  borderRadius="full"
                  isAnimated
                  hasStripe
                />
              ) : (
                <Progress
                  isIndeterminate
                  size="xs"
                  colorScheme="teal"
                  borderRadius="full"
                />
              )}
            </VStack>
          ) : !isError && result ? (
            /* SUCCESS / APPROVED STATE */
            <VStack spacing={4} align="stretch">
              <Box p={4} bg={successBoxBg} borderRadius="xl" border="1px solid" borderColor={successBoxBorder}>
                <HStack justify="space-between" mb={2}>
                  <Text fontSize="sm" fontWeight="700" color={successTitleColor}>
                    Regulatory Authenticity Confirmed
                  </Text>
                  <Badge colorScheme="green" fontSize="xs" px={2} py={0.5} borderRadius="full">
                    {Math.round((result.aiGatekeeper?.confidence || 0.96) * 100)}% Confidence
                  </Badge>
                </HStack>
                <Text fontSize="sm" color={successTextColor}>
                  {result.aiGatekeeper?.reasoning ||
                    'Document verified as official UK financial regulatory statutory text.'}
                </Text>
              </Box>

              <VStack align="stretch" spacing={2.5} p={3.5} bg={sectionBg} borderRadius="xl">
                <HStack justify="space-between">
                  <Text fontSize="xs" color={subTextColor}>Document Title:</Text>
                  <Text fontSize="xs" fontWeight="700" color={headingColor} maxW="280px" isTruncated>
                    {result.title || currentFileName}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color={subTextColor}>Regulatory Authority:</Text>
                  <Badge colorScheme="blue">{result.authority || currentAuthority || 'FCA'}</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color={subTextColor}>Detected Rule Codes:</Text>
                  <Text fontSize="xs" fontWeight="600" color={headingColor}>
                    {result.aiGatekeeper?.detectedRuleCodes?.join(', ') || result.ruleCode || 'General Provisions'}
                  </Text>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color={subTextColor}>Indexed Semantic Chunks:</Text>
                  <HStack spacing={1} color="#52796F">
                    <Layers size={14} />
                    <Text fontSize="xs" fontWeight="700">
                      {result.chunkCount || 0} chunks
                    </Text>
                  </HStack>
                </HStack>
                <HStack justify="space-between">
                  <Text fontSize="xs" color={subTextColor}>Knowledge Base Status:</Text>
                  <Badge colorScheme="green">INDEXED & READY</Badge>
                </HStack>
              </VStack>
            </VStack>
          ) : (
            /* ERROR / REJECTION STATE */
            <VStack spacing={4} align="stretch">
              <Box
                p={4}
                bg={
                  isDuplicate
                    ? errDuplicateBg
                    : isNetworkOrOffline || isEmptyOrUnreadable
                    ? errOfflineBg
                    : errRejectedBg
                }
                borderRadius="xl"
                border="1px solid"
                borderColor={
                  isDuplicate
                    ? errDuplicateBorder
                    : isNetworkOrOffline || isEmptyOrUnreadable
                    ? errOfflineBorder
                    : errRejectedBorder
                }
              >
                <HStack
                  spacing={2}
                  mb={2}
                  color={
                    isDuplicate
                      ? errDuplicateTitle
                      : isNetworkOrOffline || isEmptyOrUnreadable
                      ? errOfflineTitle
                      : errRejectedTitle
                  }
                >
                  {isDuplicate ? (
                    <FileText size={18} />
                  ) : isNetworkOrOffline ? (
                    <WifiOff size={18} />
                  ) : isEmptyOrUnreadable ? (
                    <FileWarning size={18} />
                  ) : (
                    <ShieldAlert size={18} />
                  )}
                  <Text fontSize="sm" fontWeight="700">
                    {isDuplicate
                      ? 'Duplicate Rulebook Detected'
                      : isNetworkOrOffline
                      ? 'Cannot Connect to Backend Server (Port 5000)'
                      : isEmptyOrUnreadable
                      ? 'Document Text Parsing Failed'
                      : 'Non-Regulatory Document Rejected'}
                  </Text>
                </HStack>
                <Text
                  fontSize="sm"
                  lineHeight="1.6"
                  color={
                    isDuplicate
                      ? errDuplicateText
                      : isNetworkOrOffline || isEmptyOrUnreadable
                      ? errOfflineText
                      : errRejectedText
                  }
                  mb={isGatekeeperRejection ? 3 : 0}
                >
                  {isDuplicate
                    ? errorMessage
                    : isNetworkOrOffline
                    ? 'The application could not establish a connection to the backend server at http://localhost:5000. Please ensure your backend server is running and try again.'
                    : isEmptyOrUnreadable
                    ? errorMessage || 'The uploaded file contains no extractable text or has an unsupported format. If using a PDF, ensure it has searchable text (OCR).'
                    : cleanGatekeeperReason}
                </Text>

                {isGatekeeperRejection && (
                  <Box pt={2.5} borderTop="1px dashed" borderColor={errRejectedBorder}>
                    <Text fontSize="xs" fontWeight="700" color={errRejectedTitle} mb={1.5}>
                      Accepted Document Standards:
                    </Text>
                    <HStack spacing={1.5} wrap="wrap">
                      <Badge colorScheme="green" variant="subtle" fontSize="10px" borderRadius="md" px={2} py={0.5}>
                        Official FCA Handbook (PRIN, SYSC, COBS, etc.)
                      </Badge>
                      <Badge colorScheme="green" variant="subtle" fontSize="10px" borderRadius="md" px={2} py={0.5}>
                        PRA Rulebook & Supervisory Statements
                      </Badge>
                      <Badge colorScheme="green" variant="subtle" fontSize="10px" borderRadius="md" px={2} py={0.5}>
                        Bank of England Regulatory Policies
                      </Badge>
                    </HStack>
                  </Box>
                )}
              </Box>

              <Text fontSize="xs" color={subTextColor} textAlign="center" px={2} lineHeight="1.5">
                {isDuplicate
                  ? 'This exact rulebook is already indexed in your knowledge base. You can inspect or update it directly in the Rules Library.'
                  : isNetworkOrOffline
                  ? 'This is a server connectivity error, not an AI Gatekeeper rejection. Once the backend server is active, retry your upload.'
                  : isEmptyOrUnreadable
                  ? 'Please ensure you upload an official digital PDF, DOCX, or text file containing readable regulatory text.'
                  : 'The AI Gatekeeper strictly verifies that every document belongs to official UK statutory financial authorities (FCA, PRA, Bank of England) before indexing into the knowledge base.'}
              </Text>
            </VStack>
          )}
        </ModalBody>

        {/* Modal Footer */}
        <ModalFooter bg={footerBg} borderTop="1px solid" borderColor={dividerBorder} py={3}>
          {isProcessing ? (
            <Button isDisabled isLoading loadingText="AI Processing in Progress..." w="full" bg="#52796F" color="white" borderRadius="xl">
              Processing & Indexing...
            </Button>
          ) : isDuplicate ? (
            <HStack w="full" spacing={3}>
              <Button variant="ghost" onClick={onClose} flex="1" borderRadius="xl">
                Dismiss
              </Button>
              <Button
                colorScheme="blue"
                rightIcon={<ArrowRight size={16} />}
                onClick={() => {
                  onClose();
                  navigate('/admin/rules');
                }}
                flex="2"
                borderRadius="xl"
              >
                View in Rules Library
              </Button>
            </HStack>
          ) : !isError && result ? (
            <Button
              bg="#52796F"
              color="white"
              _hover={{ bg: '#416159' }}
              rightIcon={<ArrowRight size={16} />}
              onClick={() => {
                onClose();
                navigate('/admin/rules');
              }}
              w="full"
              size="lg"
              borderRadius="xl"
              fontWeight="700"
              boxShadow="0 4px 12px -2px rgba(82, 121, 111, 0.35)"
            >
              View in Rules Library
            </Button>
          ) : isNetworkOrOffline ? (
            <Button
              colorScheme="orange"
              onClick={onClose}
              w="full"
              borderRadius="xl"
            >
              Dismiss & Retry After Server Restart
            </Button>
          ) : isEmptyOrUnreadable ? (
            <Button
              colorScheme="orange"
              onClick={onClose}
              w="full"
              borderRadius="xl"
            >
              Choose a Readable Document
            </Button>
          ) : (
            <Button
              colorScheme="red"
              onClick={onClose}
              w="full"
              borderRadius="xl"
            >
              Choose an Official UK Regulatory Rulebook
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
