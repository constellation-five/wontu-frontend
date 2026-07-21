import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageTemplateService {

  resolveTemplate(templateKey: string, params: Record<string, any> = {}): { title: string; description: string } {
    switch (templateKey) {
      // Chat System Messages
      case 'SYS_OFFER_CLOSED':
        return {
          title: $localize`:@@sys.offer_closed.title:Offer Closed`,
          description: $localize`:@@sys.offer_closed.desc:The ${params['merchant_name']} offer has been closed by the seller and is no longer accepting orders.`,
        };
      case 'SYS_ITEMS_ARRIVED':
        return {
          title: $localize`:@@sys.items_arrived.title:Items Have Arrived`,
          description: $localize`:@@sys.items_arrived.desc:The items for the ${params['merchant_name']} offer have arrived. This chat will close to new messages on ${params['chat_closes_at']}.`,
        };
      case 'SYS_BUYER_JOINED':
        return {
          title: $localize`:@@sys.buyer_joined.title:Buyer Joined`,
          description: $localize`:@@sys.buyer_joined.desc:${params['user_name']} joined the ${params['merchant_name']} offer.`,
        };
      case 'SYS_OFFER_COMPLETED':
        return {
          title: $localize`:@@sys.offer_completed.title:Offer Completed`,
          description: $localize`:@@sys.offer_completed.desc:The ${params['merchant_name']} offer has been marked as completed.`,
        };
      case 'SYS_BUYER_LEFT':
        return {
          title: $localize`:@@sys.buyer_left.title:Buyer Left`,
          description: $localize`:@@sys.buyer_left.desc:${params['user_name']} left the ${params['merchant_name']} offer.`,
        };
      case 'SYS_OFFER_UPDATED':
        return {
          title: $localize`:@@sys.offer_updated.title:Offer Updated`,
          description: $localize`:@@sys.offer_updated.desc:The ${params['merchant_name']} offer was updated by the seller.`,
        };

      // Notifications
      case 'NOTIF_BUYER_JOINED':
        return {
          title: $localize`:@@notif.buyer_joined.title:New Buyer Joined`,
          description: $localize`:@@notif.buyer_joined.desc:${params['buyer_name']} joined your ${params['merchant_name']} offer.`,
        };
      case 'NOTIF_BUYER_REMOVED_FROM_OFFER':
        return {
          title: $localize`:@@notif.buyer_removed.title:Your Order Was Removed`,
          description: $localize`:@@notif.buyer_removed.desc:Your order in the ${params['merchant_name']} offer was removed because the seller reduced the available stock (${params['items']}).`,
        };
      case 'NOTIF_ITEMS_ARRIVED':
        return {
          title: $localize`:@@notif.items_arrived.title:Items Have Arrived`,
          description: $localize`:@@notif.items_arrived.desc:The items for the ${params['merchant_name']} offer you joined have arrived.`,
        };
      case 'NOTIF_OFFER_AUTO_CLOSED_SOLD_OUT':
        return {
          title: $localize`:@@notif.offer_auto_closed_sold_out.title:Offer Sold Out and Closed`,
          description: $localize`:@@notif.offer_auto_closed_sold_out.desc:Your ${params['merchant_name']} offer reached its closing time fully sold out and has been closed automatically.`,
        };
      case 'NOTIF_OFFER_CLOSED':
        return {
          title: $localize`:@@notif.offer_closed.title:Offer Closed`,
          description: $localize`:@@notif.offer_closed.desc:The ${params['merchant_name']} offer you joined has been closed.`,
        };
      case 'NOTIF_OFFER_COMPLETED':
        return {
          title: $localize`:@@notif.offer_completed.title:Offer Complete!`,
          description: $localize`:@@notif.offer_completed.desc:The ${params['merchant_name']} offer is now complete. Please proceed with payment.`,
        };
      case 'NOTIF_OFFER_DELETED':
        return {
          title: $localize`:@@notif.offer_deleted.title:Offer Deleted`,
          description: $localize`:@@notif.offer_deleted.desc:The ${params['merchant_name']} offer you joined was deleted by the seller. Your order has been cancelled.`,
        };
      case 'NOTIF_OFFER_SOLD_OUT_EARLY':
        return {
          title: $localize`:@@notif.offer_sold_out.title:Offer Sold Out`,
          description: $localize`:@@notif.offer_sold_out.desc:Your ${params['merchant_name']} offer sold out early. It will be closed automatically when it reaches its closing time.`,
        };
      case 'NOTIF_ORDER_CANCELLED':
        return {
          title: $localize`:@@notif.order_cancelled.title:Order Cancelled`,
          description: $localize`:@@notif.order_cancelled.desc:${params['buyer_name']} cancelled their order in your ${params['merchant_name']} offer.`,
        };
      case 'NOTIF_ORDER_PLACED':
        return {
          title: $localize`:@@notif.order_placed.title:New Order Placed`,
          description: $localize`:@@notif.order_placed.desc:${params['buyer_name']} placed an order in your ${params['merchant_name']} offer.`,
        };
      case 'NOTIF_ORDER_UPDATED':
        return {
          title: $localize`:@@notif.order_updated.title:Order Updated`,
          description: $localize`:@@notif.order_updated.desc:${params['buyer_name']} updated their order in your ${params['merchant_name']} offer.`,
        };
      case 'NOTIF_PAYMENT_CONFIRMED':
        return {
          title: $localize`:@@notif.payment_confirmed.title:Payment Confirmed`,
          description: $localize`:@@notif.payment_confirmed.desc:Your payment for the ${params['merchant_name']} offer has been confirmed by the seller.`,
        };
      case 'NOTIF_PAYMENT_PROOF_UPLOADED':
        return {
          title: $localize`:@@notif.payment_proof.title:Payment Proof Uploaded`,
          description: $localize`:@@notif.payment_proof.desc:${params['buyer_name']} uploaded a payment proof for your ${params['merchant_name']} offer.`,
        };
      case 'NOTIF_USER_FOLLOWED':
        return {
          title: $localize`:@@notif.user_followed.title:New Follower`,
          description: $localize`:@@notif.user_followed.desc:${params['follower_name']} started following you.`,
        };
      case 'NOTIF_ITEM_ADJUSTED':
        return {
          title: $localize`:@@notif.item_adjusted.title:Your Order Was Adjusted`,
          description: $localize`:@@notif.item_adjusted.desc:The seller reduced available stock for '${params['itemName']}' in the ${params['merchant_name']} offer, so your quantity was adjusted to ${params['newQuantity']}.`,
        };
      case 'NOTIF_OFFER_EDITED_DISRUPTIVE':
        return {
          title: $localize`:@@notif.offer_edited_disruptive.title:Important Offer Changes`,
          description: $localize`:@@notif.offer_edited_disruptive.desc:The ${params['merchant_name']} offer you joined was changed in ways that may affect your order. Please review.`,
        };
      case 'NOTIF_OFFER_EDITED':
        return {
          title: $localize`:@@notif.offer_edited.title:Offer Updated`,
          description: $localize`:@@notif.offer_edited.desc:The ${params['merchant_name']} offer you joined was updated by the seller.`,
        };
      case 'NOTIF_OFFER_CLOSING_REACHED_NOT_SOLD_OUT':
        return {
          title: $localize`:@@notif.offer_closing_reached.title:Closing Time Reached`,
          description: $localize`:@@notif.offer_closing_reached.desc:Your ${params['merchant_name']} offer's closing time was reached. It was not fully sold out, so it will remain open until you manually close it.`,
        };
      case 'NOTIF_OFFER_CREATED_FROM_LIKED_REQUEST':
        return {
          title: $localize`:@@notif.offer_created_from_liked_request.title:New Offer from Liked Request`,
          description: $localize`:@@notif.offer_created_from_liked_request.desc:An offer for '${params['request_title']}' (${params['merchant_name']}) was created based on a request you liked.`,
        };
      case 'NOTIF_NEW_CHAT_MESSAGE':
        return {
          title: $localize`:@@notif.new_chat_message.title:New message from ${params['sender']}`,
          description: params['is_image'] 
            ? $localize`:@@notif.new_chat_message.sent_image:Sent an image` 
            : params['preview'],
        };
      default:
        return { title: 'Notification', description: '' };
    }
  }

}
