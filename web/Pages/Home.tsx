import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticatedFetch } from '@shopify/app-bridge/utilities';
import type { ClientApplication } from '@shopify/app-bridge';
import { useQuery } from '@tanstack/react-query';
import {
  Banner,
  Card,
  Layout,
  Page,
  Spinner,
  Text,
  VerticalStack,
} from '@shopify/polaris';
import { apiFetch, type AuthenticatedFetch } from '../api';

type ExampleResponse = { shopId: string; now: string };

export default function Home() {
  // App Bridge 4's useAppBridge returns the new ShopifyGlobal shape, but the
  // legacy authenticatedFetch utility expects the v3 ClientApplication. The
  // runtime object is compatible; cast to satisfy the types.
  const app = useAppBridge() as unknown as ClientApplication;
  const fetcher = authenticatedFetch(app) as AuthenticatedFetch;

  const { data, isLoading, error } = useQuery<ExampleResponse, Error>({
    queryKey: ['example'],
    queryFn: () => apiFetch<ExampleResponse>(fetcher, '/api/example'),
  });

  return (
    <Page title="Cloudflare Shopify Starter">
      <Layout>
        <Layout.Section>
          <Card>
            <VerticalStack gap="4">
              <Text as="h2" variant="headingMd">
                Example protected API call 1
              </Text>
              {isLoading && (
                <Spinner accessibilityLabel="Loading" size="small" />
              )}
              {error && (
                <Banner status="critical">
                  {error instanceof Error
                    ? error.message
                    : 'Failed to fetch /api/example'}
                </Banner>
              )}
              {data && (
                <Text as="p">
                  shopId: <code>{data.shopId}</code>
                  <br />
                  server time: <code>{data.now}</code>
                </Text>
              )}
            </VerticalStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
