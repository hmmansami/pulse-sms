import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubscriberDetailRecord } from "@/types";

type SubscriberDetailProps = {
  subscriber: SubscriberDetailRecord;
};

export function SubscriberDetail({ subscriber }: SubscriberDetailProps) {
  const fullName = [subscriber.firstName, subscriber.lastName].filter(Boolean).join(" ") || "Unnamed Subscriber";
  const attributes = Object.entries(subscriber.customAttrs ?? {});

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xl font-semibold">{fullName}</p>
            <p className="text-sm text-muted-foreground">{subscriber.email ?? subscriber.phone ?? "No contact info"}</p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={subscriber.smsConsent ? "success" : "muted"}>{subscriber.smsConsent ? "Active" : "Unsubscribed"}</Badge>
            <Badge variant={subscriber.emailConsent ? "success" : "muted"}>{subscriber.emailConsent ? "Email Opt-In" : "Email Opt-Out"}</Badge>
          </div>

          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Phone:</span> {subscriber.phone ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {subscriber.email ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Location:</span> {[subscriber.city, subscriber.country].filter(Boolean).join(", ") || "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Timezone:</span> {subscriber.timezone ?? "-"}
            </p>
            <p>
              <span className="text-muted-foreground">Source:</span> {subscriber.source ?? "-"}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Tags</p>
            <div className="flex flex-wrap gap-1">
              {subscriber.tags.length ? subscriber.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>) : <p className="text-sm text-muted-foreground">No tags</p>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Custom Attributes</p>
            <div className="space-y-1 text-sm">
              {attributes.length ? (
                attributes.map(([key, value]) => (
                  <p key={key}>
                    <span className="text-muted-foreground">{key}:</span> {String(value)}
                  </p>
                ))
              ) : (
                <p className="text-muted-foreground">No custom attributes</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subscriber.events.length ? (
              subscriber.events.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-medium capitalize">{event.type.replaceAll("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString()}</p>
                  </div>
                  {event.properties ? (
                    <pre className="mt-2 overflow-auto rounded bg-slate-50 p-2 text-xs text-slate-700">{JSON.stringify(event.properties, null, 2)}</pre>
                  ) : null}
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
            )}
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Consent History</p>
            <div className="space-y-2">
              {subscriber.consentLog.length ? (
                subscriber.consentLog.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between rounded border p-2 text-sm">
                    <p>
                      {entry.channel.toUpperCase()} {entry.action.replaceAll("_", " ")} via {entry.method}
                    </p>
                    <p className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No consent history.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
