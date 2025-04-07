import { atom } from 'nanostores';
import type { BlogData } from '@lib/types';

export const tempBlog: BlogData | null = atom();