import React from 'react';
import { Box, Avatar, Typography, Fade } from '@mui/material';
import type { Message } from './types';

interface ChatInterfaceProps {
  messages: Message[];
  isProcessing: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  isProcessing,
}) => {
  return (
    <Box
      sx={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        pr: 1,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(226, 152, 164, 0.1)',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(226, 152, 164, 0.3)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(226, 152, 164, 0.5)',
          },
        },
      }}
    >
      {messages.map((message, index) => (
        <Fade in={true} key={message.id} timeout={300 * (index + 1)}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              alignSelf: message.type === 'ai' ? 'flex-start' : 'flex-end',
              maxWidth: '70%',
              flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: message.type === 'ai' ? '#F26A8D' : '#E298A4',
                boxShadow:
                  message.type === 'ai'
                    ? '0 2px 8px rgba(242, 106, 141, 0.3)'
                    : 'none',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              {message.type === 'ai' ? 'AI' : 'あなた'}
            </Avatar>
            
            <Box
              sx={{
                bgcolor: message.type === 'ai' ? 'white' : '#E298A4',
                color: message.type === 'ai' ? '#374151' : 'white',
                p: 2,
                borderRadius: 2.5,
                border:
                  message.type === 'ai'
                    ? '1px solid rgba(226, 152, 164, 0.1)'
                    : 'none',
                boxShadow:
                  message.type === 'user'
                    ? '0 3px 12px rgba(226, 152, 164, 0.3)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  width: 0,
                  height: 0,
                  borderStyle: 'solid',
                  borderWidth: message.type === 'ai' ? '8px 8px 8px 0' : '8px 0 8px 8px',
                  borderColor:
                    message.type === 'ai'
                      ? 'transparent white transparent transparent'
                      : 'transparent transparent transparent #E298A4',
                  top: '16px',
                  left: message.type === 'ai' ? '-8px' : 'auto',
                  right: message.type === 'user' ? '-8px' : 'auto',
                },
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                }}
              >
                {message.content}
              </Typography>
            </Box>
          </Box>
        </Fade>
      ))}
      
      {/* Typing Indicator */}
      {isProcessing && (
        <Fade in={true}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              alignSelf: 'flex-start',
              maxWidth: '70%',
            }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: '#F26A8D',
                boxShadow: '0 2px 8px rgba(242, 106, 141, 0.3)',
                fontSize: '0.9rem',
                fontWeight: 500,
              }}
            >
              AI
            </Avatar>
            
            <Box
              sx={{
                bgcolor: 'white',
                p: 2,
                borderRadius: 2.5,
                border: '1px solid rgba(226, 152, 164, 0.1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  gap: 0.5,
                }}
              >
                {[0, 1, 2].map((i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      bgcolor: '#E298A4',
                      animation: 'typing 1.4s infinite',
                      animationDelay: `${i * 0.2}s`,
                      '@keyframes typing': {
                        '0%, 60%, 100%': {
                          transform: 'translateY(0)',
                        },
                        '30%': {
                          transform: 'translateY(-10px)',
                        },
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
};