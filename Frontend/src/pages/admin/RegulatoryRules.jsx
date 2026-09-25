import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  VStack,
  Input,
  Select,
  Button,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  useToast,
  Spinner,
  Center,
  IconButton,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Divider,
  Tag,
  Tooltip,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useColorModeValue,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { regulatoryApi } from '../../api/regulatory.api.js';
import {
  BookOpen,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Layers,
  Upload,
  Calendar,
  AlertCircle,
  Clock,
  Globe,
  RefreshCw,
  CheckCircle2,
  Database,
  Zap,
  Cpu,
  ArrowUpRight,
  X,
} from 'lucide-react';

export const RegulatoryRules = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [authorityFilter, setAuthorityFilter] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [newVersion, setNewVersion] = useState('');
  const [updateFile, setUpdateFile] = useState(null);

  const cardBg = useColorModeValue('white', '#141E1C');
  const cardBorder = useColorModeValue('#E2EAE5', '#263B36');
  const cardHeadingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const cardSubTextColor = useColorModeValue('gray.600', '#94A3B8');
  const inputBg = useColorModeValue('white', '#182724');
  const inputBorder = useColorModeValue('gray.300', '#2B3F3B');
  const emptyCenterBg = useColorModeValue('white', '#141E1C');
  const emptyCenterBorder = useColorModeValue('gray.200', '#263B36');
  const dividerBorder = useColorModeValue('gray.100', '#263B36');
  const noticeCardBg = useColorModeValue('white', '#162320');
  const modalBg = useColorModeValue('white', '#141E1C');
  const modalHeaderBg = useColorModeValue('gray.50', '#182724');
  const modalBorder = useColorModeValue('gray.200', '#263B36');

  // FCA Live Sync Modal state
  const [fcaModalOpen, setFcaModalOpen] = useState(false);
  const [syncingRuleCode, setSyncingRuleCode] = useState(null);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const queryClient = useQueryClient();
  const toast = useToast();

  const { data: docsData, isLoading } = useQuery({
    queryKey: ['regulatoryDocs', { search, authority: authorityFilter }],
    queryFn: () => regulatoryApi.getDocuments({ search, authority: authorityFilter }),
  });

  // Query for Live FCA updates from fca.org.uk and tracked sourcebooks
  const {
    data: fcaData,
    isLoading: isFcaLoading,
    isPending: isFcaPending,
    isFetching: isFcaFetching,
    isError: isFcaError,
    error: fcaError,
    refetch: refetchFcaUpdates,
  } = useQuery({
    queryKey: ['fcaLiveUpdates'],
    queryFn: () => regulatoryApi.checkFcaUpdates(),
    enabled: fcaModalOpen,
  });

  const isFcaBusy = isFcaLoading || isFcaPending || isFcaFetching;

  const deleteMutation = useMutation({
    mutationFn: (id) => regulatoryApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['regulatoryDocs'] });
      toast({ title: 'Regulatory document removed', status: 'info', duration: 2500, isClosable: true });
    },
    onError: (err) => {
      toast({ title: 'Delete failed', description: err.message, status: 'error', duration: 3000, isClosable: true });
    },
  });

  const updateVersionMutation = useMutation({
    mutationFn: ({ id, formData }) => regulatoryApi.updateRuleVersion(id, formData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['regulatoryDocs'] });
      setUpdateModalOpen(false);
      setUpdateFile(null);
      setNewVersion('');
      toast({
        title: 'Rule version updated & broadcasted!',
        description: `New version v${res.data?.currentVersion?.version} indexed in compliance knowledge base and broadcasted to employees.`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
    },
    onError: (err) => {
      toast({ title: 'Version update failed', description: err.message, status: 'error', duration: 4000, isClosable: true });
    },
  });

  // Incremental FCA Sync Mutation
  const fcaSyncMutation = useMutation({
    mutationFn: ({ ruleCode, documentId }) => regulatoryApi.syncFcaRulebook({ ruleCode, documentId }),
    onMutate: ({ ruleCode }) => {
      setSyncingRuleCode(ruleCode);
    },
    onSuccess: (res, vars) => {
      setSyncingRuleCode(null);
      setLastSyncResult({
        ruleCode: vars.ruleCode,
        ...res.data,
      });
      queryClient.invalidateQueries({ queryKey: ['regulatoryDocs'] });
      queryClient.invalidateQueries({ queryKey: ['fcaLiveUpdates'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: `FCA ${vars.ruleCode} Updated!`,
        description: `Update complete: ${res.data?.modifiedCount || 0} modified, ${res.data?.addedCount || 0} added, ${res.data?.unchangedCount || 0} unchanged.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    },
    onError: (err) => {
      setSyncingRuleCode(null);
      toast({
        title: 'Rule Update Failed',
        description: err.response?.data?.message || err.message,
        status: 'error',
        duration: 4500,
        isClosable: true,
      });
    },
  });

  const handleOpenUpdateModal = (doc) => {
    setSelectedDoc(doc);
    const nextVer = (parseFloat(doc.version) || 1.0) + 1.0;
    setNewVersion(`${nextVer.toFixed(1)}`);
    setUpdateModalOpen(true);
  };

  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    if (!updateFile) {
      toast({ title: 'Please select the amended document file', status: 'warning', duration: 2500, isClosable: true });
      return;
    }

    const formData = new FormData();
    formData.append('file', updateFile);
    formData.append('version', newVersion);

    updateVersionMutation.mutate({ id: selectedDoc._id, formData });
  };

  const documents = docsData?.data || [];
  const trackedRulebooks = fcaData?.data?.trackedRulebooks || [];
  const liveNotices = fcaData?.data?.notices || [];

  const getAuthBadgeColor = (auth) => {
    switch (auth?.toUpperCase()) {
      case 'FCA': return 'blue';
      case 'PRA': return 'purple';
      case 'BOE': return 'green';
      default: return 'gray';
    }
  };

  const getDisplayCategory = (doc) => {
    const code = (doc.ruleCode || doc.title || '').toUpperCase();
    if (code.includes('PRIN')) return 'Principles for Businesses';
    if (code.includes('SYSC')) return 'Senior Management Systems & Controls';
    if (code.includes('FIT')) return 'Fit and Proper Requirements';
    if (code.includes('CASS')) return 'Client Assets Sourcebook';
    if (code.includes('COCON')) return 'Individual Conduct Rules';
    if (code.includes('COBS')) return 'Conduct of Business Rules';
    return doc.category || 'UK Financial Regulation';
  };

  // Check if a rulebook is one of the tracked official FCA sourcebooks
  const isTrackedFcaCode = (doc) => {
    const code = (doc.ruleCode || doc.title || '').toUpperCase();
    return ['PRIN', 'SYSC', 'FIT', 'CASS', 'COCON'].some((k) => code.includes(k));
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header with Title and Live FCA Update Action */}
        <HStack justify="space-between" align={{ base: 'start', md: 'center' }} wrap="wrap" gap={4}>
          <Box>
            <Heading size="lg" color="brand.500" fontWeight="800">
              Official UK Financial Rules Catalog
            </Heading>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Browse, search, and synchronize statutory rulebooks indexed in the compliance knowledge base.
            </Text>
          </Box>

          <Button
            size="lg"
            bg="#52796F"
            color="white"
            _hover={{ bg: '#43645C', transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(82, 121, 111, 0.35)' }}
            _active={{ bg: '#354F48' }}
            boxShadow="0 4px 14px 0 rgba(82, 121, 111, 0.3)"
            borderRadius="xl"
            px={5}
            py={3.5}
            h="auto"
            onClick={() => setFcaModalOpen(true)}
            transition="all 0.2s cubic-bezier(0.4, 0, 0.2, 1)"
          >
            <HStack spacing={3} align="center">
              <Box p={2} bg="whiteAlpha.200" borderRadius="lg" display="flex" alignItems="center" justifyContent="center">
                <Globe size={22} color="white" />
              </Box>
              <VStack align="start" spacing={0}>
                <HStack spacing={2}>
                  <Text fontWeight="800" fontSize="sm" letterSpacing="0.01em">
                    FCA Live Regulatory Update Center
                  </Text>
                  <Badge
                    bg="#84A98C"
                    color="#141E1C"
                    fontSize="2xs"
                    fontWeight="800"
                    px={2}
                    py={0.5}
                    borderRadius="full"
                  >
                    LIVE
                  </Badge>
                </HStack>
                <Text fontSize="2xs" color="whiteAlpha.800" fontWeight="500">
                  Inspect & Synchronize Official Statutory Handbooks
                </Text>
              </VStack>
            </HStack>
          </Button>
        </HStack>

        {/* Filter Bar */}
        <Card bg={cardBg} borderColor={cardBorder}>
          <CardBody p={4}>
            <HStack spacing={4}>
              <HStack flex="1" border="1px solid" borderColor={inputBorder} bg={inputBg} borderRadius="lg" px={3}>
                <Search size={18} color="#64748B" />
                <Input
                  placeholder="Search by rule title or code (e.g. Consumer Duty, PRIN 2A, SYSC 15A)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  variant="unstyled"
                  py={2}
                />
              </HStack>

              <Select
                w="220px"
                value={authorityFilter}
                onChange={(e) => setAuthorityFilter(e.target.value)}
                bg={inputBg}
                borderColor={inputBorder}
              >
                <option value="">All Authorities</option>
                <option value="FCA">FCA</option>
                <option value="PRA">PRA</option>
                <option value="BOE">Bank of England</option>
              </Select>
            </HStack>
          </CardBody>
        </Card>

        {/* Rules Grid */}
        {isLoading ? (
          <Center py={12}>
            <Spinner color="brand.500" size="xl" />
          </Center>
        ) : documents.length === 0 ? (
          <Center py={16} bg={emptyCenterBg} borderRadius="xl" border="1px solid" borderColor={emptyCenterBorder}>
            <VStack spacing={2}>
              <BookOpen size={36} color="#94A3B8" />
              <Text fontSize="md" fontWeight="600" color={cardSubTextColor}>No regulatory documents found</Text>
              <Text fontSize="xs" color="gray.400">Try adjusting your search criteria or upload a new rulebook.</Text>
            </VStack>
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
            {documents.map((doc) => {
              const displayCategory = getDisplayCategory(doc);
              const isTracked = isTrackedFcaCode(doc);
              const showSeparateCode = doc.ruleCode && !doc.title.toUpperCase().includes(doc.ruleCode.toUpperCase());

              return (
                <Card key={doc._id} _hover={{ boxShadow: 'md' }} transition="box-shadow 0.2s" bg={cardBg} borderColor={cardBorder}>
                  <CardBody p={5}>
                    <VStack align="stretch" spacing={4} justify="space-between" h="full">
                      <VStack align="stretch" spacing={2.5}>
                        <HStack justify="space-between">
                          <Badge colorScheme={getAuthBadgeColor(doc.authority)} px={2} py={0.5} borderRadius="full">
                            {doc.authority}
                          </Badge>
                          <Badge colorScheme={doc.isLatestVersion ? 'green' : 'gray'}>
                            v{doc.version} {doc.isLatestVersion ? '• Latest' : '• Superseded'}
                          </Badge>
                        </HStack>

                        <Heading size="sm" color="brand.500" noOfLines={2}>
                          {doc.title}
                        </Heading>

                        <HStack spacing={2} wrap="wrap">
                          {showSeparateCode && (
                            <Tag size="sm" colorScheme="purple" variant="subtle" fontWeight="700">
                              {doc.ruleCode}
                            </Tag>
                          )}
                          <Tag size="sm" colorScheme="gray" variant="subtle">
                            {displayCategory}
                          </Tag>
                        </HStack>
                      </VStack>

                      <Box pt={3} borderTopWidth="1px" borderColor={dividerBorder}>
                        <HStack justify="space-between" mb={3}>
                          <HStack spacing={1} color="brand.500">
                            <Database size={14} />
                            <Text fontSize="xs" fontWeight="600">{doc.chunkCount} vector clauses</Text>
                          </HStack>
                          <Text fontSize="2xs" color="gray.400">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </Text>
                        </HStack>

                        <HStack justify="space-between" align="center">
                          <Tooltip
                            label={`Document Text Tokens: ${(doc.estimatedTokens || (doc.chunkCount || 0) * 290).toLocaleString()} • AI Gatekeeper LLM Tokens: ${(doc.gatekeeperTokens || 1208).toLocaleString()} • Click to view in Token Analytics`}
                            hasArrow
                            fontSize="xs"
                          >
                            <HStack
                              spacing={1.5}
                              cursor="pointer"
                              onClick={() => navigate('/admin/cost-analysis?tab=documents')}
                            >
                              <Badge
                                bg={useColorModeValue('#EBF4F1', '#1A2926')}
                                color="#52796F"
                                border="1px solid"
                                borderColor={useColorModeValue('#CAD7D0', '#2B4A43')}
                                px={2}
                                py={0.8}
                                borderRadius="md"
                                fontSize="2xs"
                                fontWeight="800"
                                _hover={{ bg: useColorModeValue('#DEF0EA', '#233934') }}
                                transition="all 0.15s"
                              >
                                <HStack spacing={1}>
                                  <Cpu size={11} color="#52796F" />
                                  <Text>
                                    {(doc.estimatedTokens || (doc.chunkCount || 0) * 290).toLocaleString()} tokens
                                  </Text>
                                </HStack>
                              </Badge>

                              {doc.isBigFile && (
                                <Badge
                                  bg="#FEF3C7"
                                  color="#92400E"
                                  fontSize="2xs"
                                  fontWeight="800"
                                  px={1.5}
                                  py={0.8}
                                  borderRadius="md"
                                >
                                  🔥 Large File
                                </Badge>
                              )}
                            </HStack>
                          </Tooltip>

                          <Tooltip label={`Delete "${doc.title}" from knowledge base`} hasArrow>
                            <IconButton
                              size="xs"
                              icon={<Trash2 size={13} />}
                              colorScheme="red"
                              variant="ghost"
                              aria-label="Delete rule"
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete "${doc.title}"?`)) {
                                  deleteMutation.mutate(doc._id);
                                }
                              }}
                            />
                          </Tooltip>
                        </HStack>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              );
            })}
          </SimpleGrid>
        )}
      </VStack>

      {/* FCA Live Update Center Modal */}
      <Modal
        isOpen={fcaModalOpen}
        onClose={() => {
          setFcaModalOpen(false);
          setLastSyncResult(null);
        }}
        closeOnOverlayClick={true}
        closeOnEsc={true}
        isCentered
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent bg={modalBg} borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor={modalBorder} maxH="90vh">
          <ModalHeader bg={modalHeaderBg} borderBottomWidth="1px" borderColor={modalBorder} py={4}>
            <HStack justify="space-between" align="center">
              <HStack spacing={3}>
                <Box p={2} bg="purple.100" color="purple.700" borderRadius="lg">
                  <Globe size={22} />
                </Box>
                <Box>
                  <HStack spacing={2}>
                    <Heading size="md" color="brand.500">
                      FCA Live Regulatory Update Center
                    </Heading>
                    <Badge colorScheme="green" variant="solid" fontSize="2xs" px={2} borderRadius="full">
                      LIVE INTEGRATION
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="gray.500" mt={0.5}>
                    Automated statutory feed from the Financial Conduct Authority (fca.org.uk)
                  </Text>
                </Box>
              </HStack>

              <HStack spacing={2}>
                <Tooltip label="Refresh live notices and updates from FCA" hasArrow>
                  <IconButton
                    icon={<RefreshCw size={14} />}
                    size="sm"
                    variant="outline"
                    aria-label="Refresh feed"
                    isLoading={isFcaFetching}
                    onClick={async () => {
                      try {
                        await regulatoryApi.checkFcaUpdates(true);
                        refetchFcaUpdates();
                        toast({ title: 'FCA Live Feed Refreshed', status: 'success', duration: 2000, isClosable: true });
                      } catch (err) {
                        refetchFcaUpdates();
                      }
                    }}
                  />
                </Tooltip>

                <Tooltip label="Close modal (Esc)" hasArrow>
                  <IconButton
                    icon={<X size={16} />}
                    size="sm"
                    variant="ghost"
                    colorScheme="gray"
                    aria-label="Close modal"
                    onClick={() => {
                      setFcaModalOpen(false);
                      setLastSyncResult(null);
                    }}
                  />
                </Tooltip>
              </HStack>
            </HStack>
          </ModalHeader>

          <ModalBody p={6}>
            <VStack spacing={5} align="stretch">
              {/* Smart rule update alert */}
              <Alert status="info" borderRadius="xl" variant="subtle" py={3}>
                <AlertIcon />
                <Box fontSize="xs">
                  <AlertTitle fontWeight="700">Smart Rule Updates:</AlertTitle>
                  <AlertDescription color="gray.600">
                    When updating a rulebook, the system automatically updates only the amended clauses while keeping existing unchanged rules intact.
                  </AlertDescription>
                </Box>
              </Alert>

              {/* Last Sync Result Banner (if any) */}
              {lastSyncResult && (
                <Alert status="success" borderRadius="xl" variant="left-accent" py={3}>
                  <AlertIcon />
                  <Box fontSize="xs" w="full">
                    <AlertTitle fontWeight="700">
                      Update Applied to {lastSyncResult.ruleCode} (v{lastSyncResult.version || lastSyncResult.newVersion}):
                    </AlertTitle>
                    <AlertDescription mt={1} color="gray.700">
                      <HStack spacing={4} my={1} fontWeight="600">
                        <Text color="blue.600">Modified: {lastSyncResult.modifiedCount || 0}</Text>
                        <Text color="green.600">Added: {lastSyncResult.addedCount || 0}</Text>
                        <Text color="gray.600">Preserved: {lastSyncResult.unchangedCount || 0}</Text>
                      </HStack>
                      <Text fontSize="2xs" color="gray.600" mt={1}>
                        <strong>AI Summary:</strong> {lastSyncResult.changesSummary}
                      </Text>
                    </AlertDescription>
                  </Box>
                </Alert>
              )}

              {/* Tabs: Tracked Sourcebooks & Live Releases */}
              <Tabs variant="enclosed" colorScheme="brand">
                <TabList borderColor={modalBorder}>
                  <Tab fontWeight="700" fontSize="sm" _selected={{ color: '#52796F', borderColor: '#CAD7D0', borderBottomColor: modalBg }}>
                    Tracked Core Sourcebooks {isFcaBusy ? '(Loading...)' : `(${trackedRulebooks.length})`}
                  </Tab>
                  <Tab fontWeight="700" fontSize="sm" _selected={{ color: '#52796F', borderColor: '#CAD7D0', borderBottomColor: modalBg }}>
                    Live FCA Publications Feed {isFcaBusy ? '(Loading...)' : `(${liveNotices.length})`}
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab 1: Tracked Rulebooks */}
                  <TabPanel px={0} pt={4}>
                    {isFcaBusy ? (
                      <Center py={12}>
                        <VStack spacing={3}>
                          <Spinner color="#52796F" size="lg" thickness="3px" />
                          <Text fontSize="xs" color="gray.500" fontWeight="600">
                            Checking official statutory instruments & rule updates...
                          </Text>
                        </VStack>
                      </Center>
                    ) : isFcaError ? (
                      <Center py={10}>
                        <VStack spacing={3}>
                          <AlertCircle size={32} color="#E53E3E" />
                          <Text fontSize="sm" color="red.600" fontWeight="700">
                            Failed to connect to FCA Live Feed
                          </Text>
                          <Text fontSize="xs" color="gray.500" maxW="380px" textAlign="center">
                            {fcaError?.message || 'The server could not reach the FCA publication feed.'}
                          </Text>
                          <Button size="sm" bg="#52796F" color="white" _hover={{ bg: '#43645C' }} onClick={() => refetchFcaUpdates()}>
                            Retry Connection
                          </Button>
                        </VStack>
                      </Center>
                    ) : trackedRulebooks.length === 0 ? (
                      <Center py={10}>
                        <Text fontSize="sm" color="gray.500">No tracked rulebooks configured.</Text>
                      </Center>
                    ) : (
                      <VStack spacing={4} align="stretch">
                        {trackedRulebooks.map((item) => (
                          <Card key={item.ruleCode} variant="outline" borderRadius="xl" borderColor={cardBorder} bg={cardBg}>
                            <CardBody p={4}>
                              <HStack justify="space-between" align="start" wrap="wrap" gap={3}>
                                <VStack align="start" spacing={1} flex="1">
                                  <HStack spacing={2}>
                                    <Badge bg="#F4F7F5" color="#52796F" border="1px solid #CAD7D0" px={2} py={0.5} borderRadius="md" fontWeight="800">
                                      {item.ruleCode}
                                    </Badge>
                                    <Heading size="xs" color={cardHeadingColor}>
                                      {item.title}
                                    </Heading>
                                    {item.isIndexed ? (
                                      item.hasUpdate ? (
                                        <Badge colorScheme="orange" variant="solid" fontSize="2xs" px={2} borderRadius="full">
                                          Amendment Available
                                        </Badge>
                                      ) : (
                                        <Badge bg="#E8F5E9" color="#2E7D32" fontSize="2xs" px={2} borderRadius="full">
                                          Up to Date (v{item.currentVersion})
                                        </Badge>
                                      )
                                    ) : (
                                      <Badge colorScheme="gray" variant="subtle" fontSize="2xs" px={2} borderRadius="full">
                                        Baseline Not Uploaded
                                      </Badge>
                                    )}
                                  </HStack>

                                  <Text fontSize="2xs" color="#52796F" fontWeight="700" mt={1}>
                                    Statutory Instrument: {item.latestInstrument}
                                  </Text>

                                  <Text fontSize="xs" color={cardSubTextColor} mt={0.5}>
                                    {item.updateDescription}
                                  </Text>

                                  <HStack spacing={3} mt={1} fontSize="2xs" color="gray.400">
                                    <HStack spacing={1}>
                                      <Calendar size={12} />
                                      <Text>Effective Date: {item.effectiveDate}</Text>
                                    </HStack>
                                    {item.isIndexed && (
                                      <HStack spacing={1}>
                                        <Layers size={12} />
                                        <Text>Current Version: v{item.currentVersion}</Text>
                                      </HStack>
                                    )}
                                  </HStack>
                                </VStack>

                                <Box>
                                  {!item.isIndexed ? (
                                    <Tooltip label="Upload baseline rulebook from the Upload page first" hasArrow>
                                      <Button size="sm" isDisabled colorScheme="gray" variant="outline">
                                        Upload Baseline First
                                      </Button>
                                    </Tooltip>
                                  ) : (
                                    <Button
                                      size="sm"
                                      leftIcon={item.hasUpdate ? <Zap size={14} /> : <CheckCircle2 size={14} />}
                                      bg={item.hasUpdate ? '#52796F' : 'transparent'}
                                      color={item.hasUpdate ? 'white' : '#52796F'}
                                      border={item.hasUpdate ? 'none' : '1px solid #CAD7D0'}
                                      _hover={{ bg: item.hasUpdate ? '#43645C' : '#F4F7F5' }}
                                      isLoading={syncingRuleCode === item.ruleCode}
                                      loadingText="Updating Rules..."
                                      onClick={() =>
                                        fcaSyncMutation.mutate({
                                          ruleCode: item.ruleCode,
                                          documentId: item.documentId,
                                        })
                                      }
                                    >
                                      {item.hasUpdate ? 'Apply Update' : 'Re-check Rules'}
                                    </Button>
                                  )}
                                </Box>
                              </HStack>
                            </CardBody>
                          </Card>
                        ))}
                      </VStack>
                    )}
                  </TabPanel>

                  {/* Tab 2: Live Notices Feed */}
                  <TabPanel px={0} pt={4}>
                    {isFcaBusy ? (
                      <Center py={12}>
                        <VStack spacing={3}>
                          <Spinner color="#52796F" size="lg" thickness="3px" />
                          <Text fontSize="xs" color="gray.500" fontWeight="600">
                            Connecting to live publications feed from fca.org.uk...
                          </Text>
                        </VStack>
                      </Center>
                    ) : isFcaError ? (
                      <Center py={10}>
                        <VStack spacing={3}>
                          <AlertCircle size={32} color="#E53E3E" />
                          <Text fontSize="sm" color="red.600" fontWeight="700">
                            Unable to retrieve live FCA publications
                          </Text>
                          <Button size="sm" bg="#52796F" color="white" _hover={{ bg: '#43645C' }} onClick={() => refetchFcaUpdates()}>
                            Retry Feed
                          </Button>
                        </VStack>
                      </Center>
                    ) : liveNotices.length === 0 ? (
                      <Center py={10}>
                        <Text fontSize="sm" color="gray.500">No live notices available right now.</Text>
                      </Center>
                    ) : (
                      <VStack spacing={3} align="stretch" maxH="420px" overflowY="auto" pr={1}>
                        {liveNotices.map((notice) => (
                          <Box
                            key={notice.id || notice.title}
                            p={3.5}
                            border="1px solid"
                            borderColor={cardBorder}
                            borderRadius="xl"
                            bg={noticeCardBg}
                            _hover={{ borderColor: '#CAD7D0' }}
                            transition="all 0.2s"
                          >
                            <HStack justify="space-between" align="start">
                              <VStack align="start" spacing={1} flex="1">
                                <HStack spacing={2}>
                                  {notice.sourcebookCode && (
                                    <Badge bg="#F4F7F5" color="#52796F" border="1px solid #CAD7D0" fontSize="2xs">
                                      {notice.sourcebookCode}
                                    </Badge>
                                  )}
                                  <Badge colorScheme="blue" variant="subtle" fontSize="2xs">
                                    Official FCA Release
                                  </Badge>
                                  <Text fontSize="2xs" color="gray.400">
                                    {notice.pubDate}
                                  </Text>
                                </HStack>

                                <Heading size="xs" color={cardHeadingColor}>
                                  {notice.title}
                                </Heading>

                                <Text fontSize="xs" color={cardSubTextColor} mt={0.5}>
                                  {notice.description}
                                </Text>
                              </VStack>

                              {notice.link && (
                                <IconButton
                                  as="a"
                                  href={notice.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  icon={<ArrowUpRight size={15} />}
                                  size="xs"
                                  variant="ghost"
                                  color="#52796F"
                                  _hover={{ bg: '#F4F7F5' }}
                                  aria-label="Open on fca.org.uk"
                                />
                              )}
                            </HStack>
                          </Box>
                        ))}
                      </VStack>
                    )}
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </VStack>
          </ModalBody>

          <ModalFooter bg={modalHeaderBg} borderTopWidth="1px" borderColor={modalBorder} py={3}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFcaModalOpen(false);
                setLastSyncResult(null);
              }}
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Manual File Version Update Modal */}
      <Modal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        closeOnOverlayClick={true}
        closeOnEsc={true}
        isCentered
        size="md"
      >
        <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(3px)" />
        <ModalContent borderRadius="2xl">
          <ModalHeader>Update Regulatory Version</ModalHeader>
          <form onSubmit={handleUpdateSubmit}>
            <ModalBody>
              <VStack spacing={4} align="stretch">
                <Box p={3} bg="blue.50" borderRadius="lg">
                  <Text fontSize="xs" fontWeight="700" color="blue.800">
                    Current Version: {selectedDoc?.title} (v{selectedDoc?.version})
                  </Text>
                  <Text fontSize="2xs" color="blue.600" mt={1}>
                    Uploading an updated document will supersede this version, re-index new clauses in the compliance knowledge base, generate an AI diff summary, and broadcast an alert to all employees.
                  </Text>
                </Box>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">New Version Number</FormLabel>
                  <Input value={newVersion} onChange={(e) => setNewVersion(e.target.value)} />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm">Updated Document File (.pdf / .docx)</FormLabel>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.doc"
                    p={1}
                    onChange={(e) => setUpdateFile(e.target.files[0])}
                  />
                </FormControl>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={() => setUpdateModalOpen(false)}>
                Cancel
              </Button>
              <Button
                colorScheme="brand"
                type="submit"
                isLoading={updateVersionMutation.isPending}
                loadingText="Updating & Broadcasting..."
              >
                Upload & Broadcast Update
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </Container>
  );
};
