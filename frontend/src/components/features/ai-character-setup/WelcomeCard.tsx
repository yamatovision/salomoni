import React from 'react';
import { Box, Paper, Typography, Button } from '@mui/material';
import { Sparkles } from 'lucide-react';

interface WelcomeCardProps {
  onStart: () => void;
}

export const WelcomeCard: React.FC<WelcomeCardProps> = ({ onStart }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
      }}
    >
      <Paper
        sx={{
          p: 4,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #fce7f3 0%, #f3e8ff 50%, #e0e7ff 100%)',
          border: '1px solid rgba(226, 152, 164, 0.2)',
          boxShadow: '0 6px 20px rgba(226, 152, 164, 0.15)',
          textAlign: 'center',
          maxWidth: 600,
          width: '100%',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Sparkles size={48} color="#F26A8D" />
        </Box>
        
        <Typography
          variant="h4"
          sx={{
            mb: 2,
            fontWeight: 500,
            color: '#374151',
          }}
        >
          AIアシスタントを作成しましょう
        </Typography>
        
        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: '#374151',
            opacity: 0.9,
            lineHeight: 1.6,
          }}
        >
          あなた専用のAIアシスタントを作成します。
          <br />
          簡単な質問にお答えいただくだけで、あなたにぴったりのアドバイザーが完成します。
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          onClick={onStart}
          sx={{
            bgcolor: '#F26A8D',
            color: 'white',
            borderRadius: 25,
            px: 4,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: '0 4px 15px rgba(242, 106, 141, 0.3)',
            '&:hover': {
              bgcolor: '#e11d48',
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 20px rgba(242, 106, 141, 0.4)',
            },
          }}
        >
          セットアップを開始
        </Button>
      </Paper>
    </Box>
  );
};