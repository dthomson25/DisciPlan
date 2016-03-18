import random
import math
import datetime

f = open('lazy.sql','w')
f.write("use disciplan;\n")
dnames = ['www.google.com','www.facebook.com','www.w3schools.com','chartjs.org','twitter.com','stackoverflow.com','canvas.stanford.edu','www.instagram.com']
users = ['jeff1731','jross3','danthom','adamii']
date = datetime.datetime.utcnow()

def randDateTime():
    randDelta = datetime.timedelta(days=random.randint(1,30),hours=random.randint(0,12))
    return date - randDelta

def sqlDateStr(d):
    months = {'Jan' : '01', '02' : '02', '03' : '03', 'Apr' : '04', 'May' : '05', 'Jun' : '06', 'Jul' : '07', 'Aug' : '08', 'Sep' : '09', 'Oct' : '10', 'Nov' : '11', 'Dec' : 12}
    m = '{:02d}'.format(d.month)
     
     
    s = str(d.year) + '-' + str(m) + '-' + d.strftime('%d') + ' ' + '{:02d}'.format(random.randint(0,12)) + ':00:' + str(random.randint(0,5)) + str(random.randint(0,9))
    return s

for i in range(1000):
    user = users[random.randint(0,len(users)-1)]
    dname = dnames[random.randint(0,len(dnames)-1)]
    d = randDateTime()
    s = sqlDateStr(d)
    f.write('insert into TimeSpent values(\'' + user + '\',\'' + dname + '\',\'' + s + '\',' + str((i+random.randint(0,100)/5 + 10)) + ');\n')
f.close()
