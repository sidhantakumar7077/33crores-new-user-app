import React, { useEffect, useMemo, useState } from 'react';
import { Linking } from 'react-native';
import moment from 'moment';
import PromotionModal from './PromotionModal';

const PromotionGate = ({
  baseUrl,                   // e.g., https://pandit.33crores.com/
  endpoint = 'api/manage-promotion',
  visibleOnMount = true,     // toggle if you want control outside
  onOpen,                    // optional callback when modal opens
  onClose,                   // optional callback when modal closes
}) => {
  const [promo, setPromo] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visibleOnMount) fetchPromotion();
  }, [visibleOnMount]);

  const fetchPromotion = async () => {
    try {
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'GET',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      });
      const json = await res.json();

      if (json?.success && Array.isArray(json.data) && json.data.length) {
        // Prefer active; fallback to first
        const item = json.data.find(x => (x.status || '').toLowerCase() === 'active') || json.data[0];
        if (shouldShow(item)) {
          setPromo(item);
          setVisible(true);
          onOpen && onOpen(item);
        }
      }
    } catch (e) {
      console.error('Promotion fetch failed:', e);
    }
  };

  const shouldShow = (item) => {
    if (!item) return false;
    const statusOk = !item.status || String(item.status).toLowerCase() === 'active';
    const now = moment().startOf('day');
    const startOk = item.start_date ? now.isSameOrAfter(moment(item.start_date, 'YYYY-MM-DD')) : true;
    const endOk   = item.end_date   ? now.isSameOrBefore(moment(item.end_date, 'YYYY-MM-DD'))   : true;
    return statusOk && startOk && endOk;
  };

  const close = () => {
    setVisible(false);
    onClose && onClose();
  };

  return (
    <PromotionModal
      visible={visible}
      data={promo}
      onClose={close}
      onSecondaryPress={close}
      onPrimaryPress={() => {
        close();
        // TODO: change to in-app navigation if you have it
        Linking.openURL('https://pandit.33crores.com/');
      }}
      primaryText="Book Now"
      secondaryText="Later"
    />
  );
};

export default PromotionGate;
