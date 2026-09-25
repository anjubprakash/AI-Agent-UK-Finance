import React, { useState } from 'react';
import {
  Box,
  Flex,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  HStack,
  VStack,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  useToast,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { regulatoryApi } from '../../api/regulatory.api.js';
import { authApi } from '../../api/auth.api.js';
import {
  BookOpen,
  Database,
  Upload,
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
  Trash2,
  Users,
  UserPlus,
  Coins,
  Code2,
} from 'lucide-react';
import { ComplianceWidget } from '../../components/widget/ComplianceWidget.jsx';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [deletingId, setDeletingId] = useState(null);

  const cardBg = useColorModeValue('white', '#141E1C');
  const cardBorder = useColorModeValue('#E5ECE8', '#263B36');
  const cardHeadingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const cardSubTextColor = useColorModeValue('#64748B', '#94A3B8');
  const iconBoxBg = useColorModeValue('#F4F7F5', '#1A2926');
  const theadBg = useColorModeValue('#F4F7F5', '#1A2926');
  const trHoverBg = useColorModeValue('#F4F7F5', '#1C2B27');
  const badgeBg = useColorModeValue('#F4F7F5', '#1A2926');
  const badgeBorder = useColorModeValue('#CAD7D0', '#344E48');
  const emptyBoxBg = useColorModeValue('#F4F7F5', '#111A18');
  const emptyBoxBorder = useColorModeValue('#CAD7D0', '#2B3F3B');
  const emptyIconBg = useColorModeValue('white', '#182724');
  const emptyTitleColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const heroBtnBg = useColorModeValue('white', '#182724');
  const heroBtnText = useColorModeValue('#2F3E46', '#F1F5F9');
  const heroBtnHover = useColorModeValue('#F4F7F5', '#223530');

  const { data: docsData, isLoading: docsLoading } = useQuery({
    queryKey: ['regulatoryDocs'],
    queryFn: () => regulatoryApi.getDocuments(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => authApi.getUsers(),
  });

  const adminCount = usersData?.data?.adminCount || 0;
  const employeeCount = usersData?.data?.employeeCount || 0;

  const documents = docsData?.data || [];
  const totalChunks = documents.reduce((sum, d) => sum + (d.chunkCount || 0), 0);
  const fcaCount = documents.filter((d) => d.authority === 'FCA').length;
  const praCount = documents.filter((d) => d.authority === 'PRA').length;

  const handleDeleteDocument = async (id, title) => {
    setDeletingId(id);
    try {
      await regulatoryApi.deleteDocument(id);
      toast({
        title: 'Document deleted',
        description: `'${title}' and its vectors were successfully removed.`,
        status: 'info',
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['regulatoryDocs'] });
    } catch (err) {
      toast({
        title: 'Delete error',
        description: err.message,
        status: 'error',
        duration: 4000,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={7} align="stretch">
        {/* Executive Hero Banner */}
        <Box
          p={{ base: 6, md: 8 }}
          borderRadius="2xl"
          bg="#2F3E46"
          color="white"
          boxShadow="0 10px 25px -5px rgba(47, 62, 70, 0.2)"
          position="relative"
          overflow="hidden"
          border="1px solid"
          borderColor="#354F52"
        >
          {/* Subtle Background Accent */}
          <Box
            position="absolute"
            top="-50px"
            right="-50px"
            w="260px"
            h="260px"
            bg="#52796F"
            borderRadius="full"
            filter="blur(80px)"
            opacity="0.3"
            pointerEvents="none"
          />

          <Flex
            justify="space-between"
            align={{ base: 'start', md: 'center' }}
            direction={{ base: 'column', md: 'row' }}
            gap={6}
            position="relative"
            zIndex="1"
          >
            <VStack align="start" spacing={3} maxW="700px">
              <HStack spacing={2.5}>
                <Badge bg="#52796F" color="white" fontSize="11px" px={2.5} py={0.5} borderRadius="md" fontWeight="800">
                  ADMIN CONTROL CENTER
                </Badge>
                <HStack spacing={1.5} fontSize="11px" color="#CAD7D0" fontWeight="600">
                  <ShieldCheck size={14} color="#84A98C" />
                  <span>Official UK Compliance Governance</span>
                </HStack>
              </HStack>

              <Heading size="lg" fontWeight="900" letterSpacing="-0.02em" lineHeight="1.2">
                UK Regulatory Intelligence & Handbook Governance
              </Heading>

              <Text fontSize="sm" color="#CAD7D0" lineHeight="1.6">
                Supervise official FCA and PRA handbook ingestion, monitor AI Gatekeeper document verification, inspect semantic regulatory vectors, and test compliance responses.
              </Text>
            </VStack>

            <HStack spacing={3} wrap="wrap">
              <Button
                bg="#52796F"
                color="white"
                _hover={{ bg: '#416159' }}
                size="md"
                leftIcon={<MessageSquare size={17} />}
                onClick={() => navigate('/chat')}
                boxShadow="0 4px 12px -2px rgba(82, 121, 111, 0.4)"
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
              >
                Chat & Test Copilot
              </Button>

              <Button
                bg={heroBtnBg}
                color={heroBtnText}
                _hover={{ bg: heroBtnHover }}
                size="md"
                leftIcon={<Code2 size={17} />}
                onClick={() => navigate('/widget')}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
              >
                AI Widget & Embed Code
              </Button>

              <Button
                bg={heroBtnBg}
                color={heroBtnText}
                _hover={{ bg: heroBtnHover }}
                size="md"
                leftIcon={<Users size={17} />}
                onClick={() => navigate('/admin/users')}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
              >
                Team & Admins
              </Button>

              <Button
                bg={heroBtnBg}
                color={heroBtnText}
                _hover={{ bg: heroBtnHover }}
                size="md"
                leftIcon={<Upload size={17} />}
                onClick={() => navigate('/admin/upload')}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
              >
                Ingest Rulebook
              </Button>

              <Button
                bg={heroBtnBg}
                color={heroBtnText}
                _hover={{ bg: heroBtnHover }}
                size="md"
                leftIcon={<Coins size={17} />}
                onClick={() => navigate('/admin/cost-analysis')}
                fontWeight="700"
                fontSize="sm"
                borderRadius="xl"
              >
                Token Analysis
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Metric KPI Cards (4 Cards) */}
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} spacing={5}>
          {/* Rulebooks Metric */}
          <Card
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={cardBorder}
            borderTop="4px solid"
            borderTopColor="#52796F"
            boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
          >
            <CardBody p={5}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="11px" fontWeight="800" color="#52796F" textTransform="uppercase" letterSpacing="0.05em">
                    Indexed Rulebooks
                  </Text>
                  <Heading size="xl" color={cardHeadingColor} mt={1} fontWeight="900">
                    {documents.length}
                  </Heading>
                  <Text fontSize="xs" color={cardSubTextColor} mt={1.5} fontWeight="600">
                    {fcaCount} FCA • {praCount} PRA
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <BookOpen size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          {/* Vector Chunks Metric */}
          <Card
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={cardBorder}
            borderTop="4px solid"
            borderTopColor="#84A98C"
            boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
          >
            <CardBody p={5}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="11px" fontWeight="800" color="#52796F" textTransform="uppercase" letterSpacing="0.05em">
                    Vector Chunks
                  </Text>
                  <Heading size="xl" color={cardHeadingColor} mt={1} fontWeight="900">
                    {totalChunks}
                  </Heading>
                  <Text fontSize="xs" color="#52796F" mt={1.5} fontWeight="700">
                    Knowledge Base Active
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <Database size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          {/* Team & Admin Access Metric */}
          <Card
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={cardBorder}
            borderTop="4px solid"
            borderTopColor="#52796F"
            boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
            cursor="pointer"
            onClick={() => navigate('/admin/users')}
            _hover={{ transform: 'translateY(-2px)', borderColor: '#CAD7D0' }}
            transition="all 0.2s"
          >
            <CardBody p={5}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="11px" fontWeight="800" color="#52796F" textTransform="uppercase" letterSpacing="0.05em">
                    Team & Access
                  </Text>
                  <Heading size="xl" color={cardHeadingColor} mt={1} fontWeight="900">
                    {adminCount + employeeCount}
                  </Heading>
                  <Text fontSize="xs" color="#52796F" mt={1.5} fontWeight="700">
                    {adminCount} Admins • {employeeCount} Members
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <Users size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>

          {/* AI Gatekeeper Status */}
          <Card
            bg={cardBg}
            borderRadius="2xl"
            border="1px solid"
            borderColor={cardBorder}
            borderTop="4px solid"
            borderTopColor="#52796F"
            boxShadow="0 2px 8px -2px rgba(82, 121, 111, 0.08)"
          >
            <CardBody p={5}>
              <HStack justify="space-between" align="start">
                <Box>
                  <Text fontSize="11px" fontWeight="800" color="#52796F" textTransform="uppercase" letterSpacing="0.05em">
                    AI Gatekeeper
                  </Text>
                  <Heading size="md" color="#52796F" mt={2} fontWeight="900" display="flex" alignItems="center" gap={1.5}>
                    <Box w="8px" h="8px" borderRadius="full" bg="#52796F" />
                    ENFORCING
                  </Heading>
                  <Text fontSize="xs" color={cardSubTextColor} mt={1.5} fontWeight="600">
                    Auto-rejects Non-UK
                  </Text>
                </Box>
                <Box p={3} bg={iconBoxBg} color="#52796F" borderRadius="xl">
                  <ShieldCheck size={24} />
                </Box>
              </HStack>
            </CardBody>
          </Card>
        </SimpleGrid>
        {/* Official Rulebooks Table */}
        <Card bg={cardBg} borderRadius="2xl" border="1px solid" borderColor={cardBorder} boxShadow="sm">
          <CardBody p={6}>
            <Flex justify="space-between" align="center" mb={5} wrap="wrap" gap={3}>
              <Box>
                <Heading size="md" color={cardHeadingColor} fontWeight="800">
                  Registered UK Regulatory Rulebooks
                </Heading>
                <Text fontSize="xs" color={cardSubTextColor} mt={0.5}>
                  Official handbook documents parsed and indexed into the regulatory vector database
                </Text>
              </Box>
              <Button
                size="xs"
                variant="ghost"
                rightIcon={<ArrowUpRight size={14} />}
                onClick={() => navigate('/admin/rules')}
                color="#52796F"
                _hover={{ bg: trHoverBg }}
                fontWeight="700"
              >
                View Complete Library
              </Button>
            </Flex>

            {docsLoading ? (
              <Center py={10}>
                <Spinner color="#52796F" thickness="3px" />
              </Center>
            ) : documents.length === 0 ? (
              <Box
                py={12}
                textAlign="center"
                bg={emptyBoxBg}
                borderRadius="xl"
                border="1.5px dashed"
                borderColor={emptyBoxBorder}
              >
                <VStack spacing={3}>
                  <Box p={3} bg={emptyIconBg} color="#52796F" borderRadius="full" boxShadow="sm">
                    <BookOpen size={28} />
                  </Box>
                  <Text fontSize="sm" fontWeight="700" color={emptyTitleColor}>
                    Knowledge Base Ready for Document Ingestion
                  </Text>
                  <Text fontSize="xs" color={cardSubTextColor} maxW="450px">
                    No documents currently stored. Upload official UK sourcebooks (such as FCA FIT, PRIN, SYSC, or COBS) to index them into the compliance knowledge base.
                  </Text>
                  <Button
                    size="sm"
                    bg="#52796F"
                    color="white"
                    _hover={{ bg: '#416159' }}
                    mt={2}
                    leftIcon={<Upload size={15} />}
                    onClick={() => navigate('/admin/upload')}
                    fontWeight="700"
                    borderRadius="xl"
                  >
                    Upload First Document
                  </Button>
                </VStack>
              </Box>
            ) : (
              <Box overflowX="auto">
                <Table variant="simple" size="sm">
                  <Thead bg={theadBg}>
                    <Tr>
                      <Th fontSize="10px" color="#52796F">AUTHORITY</Th>
                      <Th fontSize="10px" color="#52796F">RULE TITLE</Th>
                      <Th fontSize="10px" color="#52796F">RULE CODE</Th>
                      <Th fontSize="10px" color="#52796F">VERSION</Th>
                      <Th fontSize="10px" color="#52796F">CHUNKS</Th>
                      <Th fontSize="10px" color="#52796F">DATE ADDED</Th>
                      <Th fontSize="10px" color="#52796F" textAlign="right">ACTION</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {documents.map((doc) => (
                      <Tr key={doc._id} _hover={{ bg: trHoverBg }} transition="all 0.15s">
                        <Td>
                          <Badge
                            fontSize="10px"
                            px={2}
                            py={0.5}
                            borderRadius="md"
                            bg={badgeBg}
                            color="#52796F"
                            border="1px solid"
                            borderColor={badgeBorder}
                          >
                            {doc.authority}
                          </Badge>
                        </Td>
                        <Td fontWeight="700" color={cardHeadingColor}>{doc.title}</Td>
                        <Td fontWeight="600" color="#52796F">{doc.ruleCode || '-'}</Td>
                        <Td color={cardSubTextColor}>v{doc.version}</Td>
                        <Td>
                          <Badge bg={badgeBg} color="#52796F" border="1px solid" borderColor={badgeBorder}>
                            {doc.chunkCount} points
                          </Badge>
                        </Td>
                        <Td color={cardSubTextColor}>{new Date(doc.createdAt).toLocaleDateString()}</Td>
                        <Td textAlign="right">
                          <Tooltip label="Delete document and remove its vectors" hasArrow>
                            <IconButton
                              size="xs"
                              variant="ghost"
                              colorScheme="red"
                              icon={<Trash2 size={14} />}
                              isLoading={deletingId === doc._id}
                              onClick={() => handleDeleteDocument(doc._id, doc.title)}
                              aria-label="Delete document"
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Live Floating AI Compliance Widget for Admin Testing */}
      <ComplianceWidget mode="floating" defaultOpen={false} />
    </Container>
  );
};
