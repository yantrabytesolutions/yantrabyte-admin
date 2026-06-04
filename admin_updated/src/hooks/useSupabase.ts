import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Service, Testimonial, BlogPost, FAQ, Industry, Career, TeamMember, Product, GalleryImage, ClientLogo, SiteSetting, ContactSubmission, Page } from '../types';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('services').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setServices((data || []) as Service[]);
      setLoading(false);
    });
  }, []);
  return { services, loading };
}

export function useService(slug: string) {
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('services').select('*').eq('slug', slug).eq('is_published', true).maybeSingle().then(({ data }) => {
      setService(data as Service | null);
      setLoading(false);
    });
  }, [slug]);
  return { service, loading };
}

export function useTestimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('testimonials').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setTestimonials((data || []) as Testimonial[]);
      setLoading(false);
    });
  }, []);
  return { testimonials, loading };
}

export function useBlogPosts(category?: string) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let query = supabase.from('blog_posts').select('*').eq('is_published', true).order('published_at', { ascending: false });
    if (category) query = query.eq('category', category);
    query.then(({ data }) => {
      setPosts((data || []) as BlogPost[]);
      setLoading(false);
    });
  }, [category]);
  return { posts, loading };
}

export function useBlogPost(slug: string) {
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('blog_posts').select('*').eq('slug', slug).eq('is_published', true).maybeSingle().then(({ data }) => {
      setPost(data as BlogPost | null);
      setLoading(false);
    });
  }, [slug]);
  return { post, loading };
}

export function useFAQs(category?: string) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let query = supabase.from('faqs').select('*').eq('is_published', true).order('sort_order');
    if (category) query = query.eq('category', category);
    query.then(({ data }) => {
      setFaqs((data || []) as FAQ[]);
      setLoading(false);
    });
  }, [category]);
  return { faqs, loading };
}

export function useIndustries() {
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('industries').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setIndustries((data || []) as Industry[]);
      setLoading(false);
    });
  }, []);
  return { industries, loading };
}

export function useCareers() {
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('careers').select('*').eq('is_active', true).order('sort_order').then(({ data }) => {
      setCareers((data || []) as Career[]);
      setLoading(false);
    });
  }, []);
  return { careers, loading };
}

export function useTeam() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('team_members').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setTeam((data || []) as TeamMember[]);
      setLoading(false);
    });
  }, []);
  return { team, loading };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('products').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setProducts((data || []) as Product[]);
      setLoading(false);
    });
  }, []);
  return { products, loading };
}

export function useGallery() {
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('gallery_images').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setGallery((data || []) as GalleryImage[]);
      setLoading(false);
    });
  }, []);
  return { gallery, loading };
}

export function useClientLogos() {
  const [logos, setLogos] = useState<ClientLogo[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('client_logos').select('*').eq('is_published', true).order('sort_order').then(({ data }) => {
      setLogos((data || []) as ClientLogo[]);
      setLoading(false);
    });
  }, []);
  return { logos, loading };
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('site_settings').select('*').then(({ data }) => {
      const map: Record<string, string> = {};
      (data as SiteSetting[] || []).forEach(s => { map[s.key] = s.value; });
      setSettings(map);
      setLoading(false);
    });
  }, []);
  return { settings, loading };
}

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from('pages').select('*').eq('is_published', true).order('page_order').then(({ data }) => {
      setPages((data || []) as Page[]);
      setLoading(false);
    });
  }, []);
  return { pages, loading };
}

export async function submitContact(data: Omit<ContactSubmission, 'id' | 'status' | 'created_at'>) {
  return supabase.from('contact_submissions').insert([data]);
}
