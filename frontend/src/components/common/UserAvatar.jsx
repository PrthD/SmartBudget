import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api';
import { keys } from '@/lib/queryClient';
import { cn } from '@/lib/utils';

const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

/**
 * The photo is fetched once per version (it needs the auth header, so it
 * can't be a plain <img src>) and cached as a blob.
 */
function useAvatarUrl(user) {
  const { data: blob } = useQuery({
    queryKey: keys.avatar(user?.photoVersion),
    queryFn: () => api.get('/users/me/avatar'),
    enabled: Boolean(user?.hasPhoto),
    staleTime: Infinity,
    meta: { silent: true },
  });
  const url = useMemo(
    () => (blob instanceof Blob ? URL.createObjectURL(blob) : null),
    [blob]
  );
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);
  return user?.hasPhoto ? url : null;
}

const SIZES = {
  md: { avatar: 'size-8', text: 'text-xs' },
  lg: { avatar: 'size-16', text: 'text-xl' },
};

export function UserAvatar({ user, size = 'md', className }) {
  const url = useAvatarUrl(user);
  return (
    <Avatar className={cn(SIZES[size].avatar, className)}>
      {url && <AvatarImage src={url} alt="" />}
      <AvatarFallback
        className={cn(
          'bg-primary/10 text-primary font-medium',
          SIZES[size].text
        )}
      >
        {initials(user?.name)}
      </AvatarFallback>
    </Avatar>
  );
}
