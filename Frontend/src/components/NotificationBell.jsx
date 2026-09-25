import React from 'react';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  IconButton,
  Box,
  Text,
  Badge,
  VStack,
  HStack,
  Button,
  useToast,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { Bell, CheckCheck, FileText, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../api/notification.api.js';
import { useAuth } from '../context/AuthContext.jsx';

export const NotificationBell = () => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated } = useAuth();

  const iconColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const iconHoverBg = useColorModeValue('#F4F7F5', '#162320');
  const popoverBg = useColorModeValue('white', '#141E1C');
  const popoverBorder = useColorModeValue('#E5ECE8', '#263B36');
  const headerBg = useColorModeValue('#F4F7F5', '#182724');
  const headingColor = useColorModeValue('#2F3E46', '#F1F5F9');
  const itemUnreadBg = useColorModeValue('#F4F7F5', '#1D2E2B');
  const itemHoverBg = useColorModeValue('#F8FAF9', '#223531');
  const itemUnreadHoverBg = useColorModeValue('#ECF2EE', '#263B36');
  const dividerColor = useColorModeValue('#F0F4F2', '#263B36');
  const subTextColor = useColorModeValue('#64748B', '#94A3B8');
  const footerBg = useColorModeValue('#F8FAF9', '#182724');
  const badgeOutline = useColorModeValue('0 0 0 2px white', '0 0 0 2px #141E1C');

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getNotifications(),
    enabled: Boolean(isAuthenticated),
    refetchInterval: isAuthenticated ? 30 * 60 * 1000 : false, // Poll every 30 minutes for updates
    retry: 1,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'All notifications marked as read',
        status: 'info',
        duration: 2000,
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      markReadMutation.mutate(item._id);
    }
    if (isAdmin) {
      navigate('/admin/rules');
    } else {
      navigate('/chat');
    }
  };

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box position="relative" display="inline-block">
          <IconButton
            icon={<Bell size={20} />}
            variant="ghost"
            aria-label="Notifications"
            size="md"
            borderRadius="full"
            color={iconColor}
            _hover={{ bg: iconHoverBg }}
          />
          {unreadCount > 0 && (
            <Badge
              position="absolute"
              top="-2px"
              right="-2px"
              bg="#E53E3E"
              color="white"
              borderRadius="full"
              px={1.5}
              py={0.5}
              fontSize="10px"
              fontWeight="800"
              boxShadow={badgeOutline}
            >
              {unreadCount}
            </Badge>
          )}
        </Box>
      </PopoverTrigger>
      <PopoverContent w="400px" bg={popoverBg} boxShadow="2xl" borderRadius="2xl" borderColor={popoverBorder} overflow="hidden">
        <PopoverHeader fontWeight="800" py={3.5} px={4} bg={headerBg} borderBottomWidth="1px" borderColor={popoverBorder}>
          <HStack justify="space-between">
            <HStack spacing={2}>
              <Bell size={16} color="#52796F" />
              <Text fontSize="sm" color={headingColor} fontWeight="800">
                Regulatory Notifications
              </Text>
            </HStack>
            {unreadCount > 0 && (
              <Badge bg="#52796F" color="white" px={2} py={0.5} borderRadius="full" fontSize="10px" fontWeight="800">
                {unreadCount} NEW
              </Badge>
            )}
          </HStack>
        </PopoverHeader>
        <PopoverBody maxH="380px" overflowY="auto" p={0}>
          {notifications.length === 0 ? (
            <Box py={8} textAlign="center" color={subTextColor}>
              <Text fontSize="sm">No notifications yet</Text>
            </Box>
          ) : (
            <VStack spacing={0} align="stretch" divider={<Divider borderColor={dividerColor} />}>
              {notifications.map((item) => (
                <Box
                  key={item._id}
                  p={3.5}
                  bg={item.isRead ? 'transparent' : itemUnreadBg}
                  cursor="pointer"
                  onClick={() => handleNotificationClick(item)}
                  _hover={{ bg: item.isRead ? itemHoverBg : itemUnreadHoverBg }}
                  transition="background 0.15s ease"
                  position="relative"
                >
                  <HStack align="start" spacing={3}>
                    <Box mt={1} color="#52796F">
                      <FileText size={18} />
                    </Box>
                    <Box flex="1">
                      <HStack justify="space-between" align="start">
                        <Text fontSize="xs" fontWeight="700" color={headingColor} lineHeight="1.3">
                          {item.title}
                        </Text>
                        {!item.isRead && (
                          <Box w={2} h={2} borderRadius="full" bg="#52796F" flexShrink={0} mt={1} />
                        )}
                      </HStack>
                      <Text fontSize="xs" color={subTextColor} mt={1} noOfLines={3} lineHeight="1.4">
                        {item.message}
                      </Text>
                      <Text fontSize="2xs" color="#84A98C" fontWeight="600" mt={1.5}>
                        {new Date(item.createdAt).toLocaleDateString()} at{' '}
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </Box>
                  </HStack>
                </Box>
              ))}
            </VStack>
          )}
        </PopoverBody>
        {unreadCount > 0 && (
          <PopoverFooter py={2.5} px={4} bg={footerBg} borderTopWidth="1px" borderColor={popoverBorder}>
            <Button
              size="xs"
              variant="ghost"
              color="#52796F"
              leftIcon={<CheckCheck size={14} />}
              onClick={() => markAllMutation.mutate()}
              isLoading={markAllMutation.isPending}
              w="full"
              fontWeight="700"
              _hover={{ bg: itemHoverBg }}
            >
              Mark all as read
            </Button>
          </PopoverFooter>
        )}
      </PopoverContent>
    </Popover>
  );
};
