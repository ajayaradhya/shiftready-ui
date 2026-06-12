import { useState } from "react";
import { View, Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { markBundleSold, renameBundle, deleteBundle } from "@myrio/api";
import type { RoomBundle } from "@myrio/types";
import {
  AppText,
  Button,
  Field,
  PillRow,
  SelectPill,
  Sheet,
  triggerHaptic,
} from "@/components/ui";

const PAY_METHODS = ["Cash", "Bank transfer", "PayID", "Other"];

export function BundleSoldSheet({
  bundle,
  eventId,
  onClose,
}: {
  bundle: RoomBundle | null;
  eventId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [soldPrice, setSoldPrice] = useState("");
  const [payMethod, setPayMethod] = useState("Cash");
  const [scope, setScope] = useState<"bundle_as_unit" | "all_items">("all_items");

  const soldMut = useMutation({
    mutationFn: () =>
      markBundleSold(eventId, bundle!.id, {
        scope,
        final_price: soldPrice ? Number(soldPrice) : null,
        payment_method: payMethod || null,
      }),
    onSuccess: () => {
      triggerHaptic("success");
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      onClose();
    },
    onError: (e: Error) => Alert.alert("Failed", e.message),
  });

  if (!bundle) return null;

  return (
    <Sheet visible onClose={onClose} title={`Mark sold — ${bundle.name}`}>
      <View>
        <AppText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
          Scope
        </AppText>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label="All items"
            size="sm"
            variant={scope === "all_items" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => setScope("all_items")}
          />
          <Button
            label="Bundle as unit"
            size="sm"
            variant={scope === "bundle_as_unit" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => setScope("bundle_as_unit")}
          />
        </View>
      </View>

      <Field
        label={scope === "all_items" ? "Total price (AUD)" : "Bundle price (AUD)"}
        value={soldPrice}
        onChangeText={setSoldPrice}
        keyboardType="numeric"
        placeholder="e.g. 200"
      />

      <View>
        <AppText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
          Payment method
        </AppText>
        <PillRow>
          {PAY_METHODS.map((m) => (
            <SelectPill key={m} label={m} selected={payMethod === m} onPress={() => setPayMethod(m)} />
          ))}
        </PillRow>
      </View>

      <Button
        label="Confirm bundle sold"
        haptic="success"
        loading={soldMut.isPending}
        onPress={() => soldMut.mutate()}
      />
    </Sheet>
  );
}

export function RenameBundleSheet({
  bundle,
  eventId,
  onClose,
}: {
  bundle: RoomBundle | null;
  eventId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState(bundle?.name ?? "");

  const renameMut = useMutation({
    mutationFn: () => renameBundle(eventId, bundle!.id, name.trim()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      onClose();
    },
    onError: (e: Error) => Alert.alert("Rename failed", e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteBundle(eventId, bundle!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      onClose();
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  if (!bundle) return null;

  return (
    <Sheet visible onClose={onClose} title="Rename bundle">
      <Field label="Bundle name" value={name} onChangeText={setName} autoFocus />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button
          label="Save"
          style={{ flex: 1 }}
          disabled={!name.trim()}
          loading={renameMut.isPending}
          onPress={() => renameMut.mutate()}
        />
        <Button
          label=""
          accessibilityLabel={`Delete bundle ${bundle.name}`}
          variant="destructive"
          icon="trash-outline"
          loading={deleteMut.isPending}
          onPress={() =>
            Alert.alert(
              "Delete bundle?",
              `"${bundle.name}" and its ${bundle.items.length} item${bundle.items.length !== 1 ? "s" : ""} will be removed.`,
              [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
              ]
            )
          }
        />
      </View>
    </Sheet>
  );
}
