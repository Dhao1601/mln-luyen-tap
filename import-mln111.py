"""Extract Quizlet PDF cards by visible card borders, not mixed-column reading order."""
import json,re,unicodedata,sys
from pathlib import Path
import pdfplumber
source=Path(sys.argv[1]);root=Path(__file__).resolve().parent
bank=[];raw=[];issues=[]
def clean(s):
 s=unicodedata.normalize('NFC',s)
 s=re.sub(r'\(?\s*NHUNG\s+HOÀNG\s*\)?','',s,flags=re.I)
 s=re.sub(r'\s+',' ',s).strip()
 for a,b in {'trường phải':'trường phái','sự phủ hợp':'sự phù hợp','chất phát':'chất phác','biện chứngvới':'biện chứng với','Cách thuc':'Cách thức','Con đường đề đạt':'Con đường để đạt','đầu tranh':'đấu tranh','đễ có':'để có','vũng chắc':'vững chắc','vẽ sự':'về sự','phát triên':'phát triển','chính tri,':'chính trị,','phạm trủ':'phạm trù','cụ thế':'cụ thể','quảng tinh':'quảng tính','được goi':'được gọi','Y chí':'Ý chí','Mất dẫn đi':'Mất dần đi','Tỉnh tại':'Tĩnh tại','Sư tồn tại':'Sự tồn tại','hoàn thiện.Vào':'hoàn thiện. Vào','dùng để chi khoảng':'dùng để chỉ khoảng'}.items():s=s.replace(a,b)
 return s
with pdfplumber.open(source) as pdf:
 for pn,page in enumerate(pdf.pages,1):
  rects=sorted([r for r in page.rects if abs(r['x0']-12)<.1 and abs(r['x1']-680.25)<.5],key=lambda r:r['top'])
  for r in rects:
   top=max(0,r['top']);bottom=min(page.height,r['bottom'])
   front=page.crop((20,top,293,bottom)).extract_text() or ''
   back=page.crop((305,top,679,bottom)).extract_text() or ''
   if not front.strip() and not back.strip():continue
   id=len(raw)+1;raw.append({'id':id,'page':pn,'q':front,'a':back})
   if id in (422,425,550):front=re.sub(r'(?m)^A ', 'A. ',front)
   if id==426:front=front.replace(' A. Ph.', '\nA. Ph.')
   if id==555:front=front.replace(' D. Quy', '\nD. Quy')
   if id==172:
    front+='\nA. Quy luật lượng - chất\nB. Quy luật thống nhất và đấu tranh giữa các mặt đối lập\nC. Quy luật phủ định của phủ định\nD. Nguyên lý về mối liên hệ phổ biến'
    back='A\nThẻ nguồn là câu tự luận, đáp án: Quy luật lượng chất. Các lựa chọn trắc nghiệm được bổ sung để luyện tập.'
   matches=list(re.finditer(r'(?:^|\n)\s*([A-Fa-f])\s*[.)]\s*',front))
   matches=matches[next((j for j,m in enumerate(matches) if m[1].upper()=='A'),len(matches)):]
   keys=re.match(r'^\s*([A-Fa-f]+)\b',back)
   if not matches or not keys:issues.append({'id':id,'page':pn,'q':front,'a':back});continue
   opts=[{'id':m[1].upper(),'text':clean(front[m.end():matches[j+1].start() if j+1<len(matches) else len(front)])} for j,m in enumerate(matches)]
   key=list(keys[1].upper());question=clean(front[:matches[0].start()]);note=clean(back[keys.end():])
   assert len({o['id'] for o in opts})==len(opts),(id,'duplicate options',opts)
   if not all(k in [o['id'] for o in opts] for k in key):
    issues.append({'id':id,'page':pn,'q':front,'a':back,'reason':'missing correct option'});continue
   assert question and all(o['text'] for o in opts),(id,'empty text')
   warning='Câu và phương án trong PDF có dấu hiệu bị cụt: thiếu phần lực lượng sản xuất và các vế hoàn chỉnh.' if id==3 else ''
   if id==427:warning='Khóa PDF chọn quan hệ sản xuất trong câu hỏi về trình độ phát triển sản xuất vật chất; cần đối chiếu với phương thức sản xuất/lực lượng sản xuất trước khi học thuộc.'
   bank.append({'id':id,'question':question,'options':opts,'correct':key,'note':note,'page':pn,'warning':warning})
(root/'notes/mln111-raw.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2))
(root/'notes/mln111-import-issues.json').write_text(json.dumps(issues,ensure_ascii=False,indent=2))
print('Cards',len(raw),'parsed',len(bank),'issues',len(issues));print(json.dumps(issues[:12],ensure_ascii=False,indent=2))
assert len(raw)==598,'card count differs from PDF header'
assert len(bank)==598,'resolve parsing issues before publishing data'
(root/'dist/data-mln111.js').write_text('const BANK_MLN111='+json.dumps(bank,ensure_ascii=False)+';\n')
print('Multi-answer',sum(len(q['correct'])>1 for q in bank));print(json.dumps(bank[:3],ensure_ascii=False,indent=2))
